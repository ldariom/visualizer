extern crate console_error_panic_hook;
use std::cell::RefCell;
use std::f64;
use std::panic;
use std::rc::Rc;
use std::sync::atomic::AtomicI32;
use std::sync::atomic::Ordering;
use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

static ANIMATION_FRAME_ID: AtomicI32 = AtomicI32::new(0);

thread_local! {
    static AUDIO_CONTEXT: RefCell<Option<Rc<web_sys::AudioContext>>> = RefCell::new(None);
}

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_f64(i: f64);
}

fn window() -> web_sys::Window {
    web_sys::window().expect("no global `window` exists")
}

fn request_animation_frame(f: &Closure<dyn FnMut()>) {
    let req_id = window()
        .request_animation_frame(f.as_ref().unchecked_ref())
        .expect("should register `requestAnimationFrame` OK");

        ANIMATION_FRAME_ID.store(req_id, Ordering::SeqCst);
}

fn cancel_animation_frame() {
    let req_id = ANIMATION_FRAME_ID.load(Ordering::SeqCst);
    window().cancel_animation_frame(req_id)
        .expect("should remove `requestAnimationFrame` ");

    web_sys::console::log_1(&"animation frame id =".into());
    web_sys::console::log_1(&req_id.into());
}

pub fn get_audio_context() -> Rc<web_sys::AudioContext> {
    AUDIO_CONTEXT.with(|ctx_cell| {
        let mut context = ctx_cell.borrow_mut();
        if let Some(ref ctx) = *context {
            let _res = ctx.close();
        }
        let ctx = web_sys::AudioContext::new().unwrap_or_else(|_| panic!("Failed to create AudioContext"));
        let ctx = Rc::new(ctx);
        *context = Some(Rc::clone(&ctx));
        return ctx;
    })
}

fn uint8array_to_arraybuffer(uint8array: Uint8Array) -> js_sys::ArrayBuffer {
    uint8array.buffer()
}

async fn load_and_play_file() -> Result<web_sys::AnalyserNode, JsValue> {

    let frame_id = ANIMATION_FRAME_ID.load(Ordering::SeqCst);
    if frame_id != 0 { 
        cancel_animation_frame();
    }

    let window = web_sys::window().unwrap();
    let audio_data = js_sys::Reflect::get(&window, &"bf".into());

    let array_buffer_data = uint8array_to_arraybuffer(audio_data.unwrap().into());

    let audio_context = get_audio_context(); 

    let dec: js_sys::Promise = audio_context.decode_audio_data(&array_buffer_data)
    .unwrap_or_else(|err| err.into());

    let buf: web_sys::AudioBuffer = wasm_bindgen_futures::JsFuture::from(dec).await?.dyn_into().unwrap();

    let source = audio_context.create_buffer_source().unwrap();

    source.set_buffer(Some(&buf));

    let analyser = audio_context.create_analyser()?;
    analyser.set_fft_size(2048);

    source.connect_with_audio_node(&analyser)?;
    analyser.connect_with_audio_node(&audio_context.destination())?;

    source.start()?;

    Ok(analyser)
}

struct Visualizer {
    height: u32,
    width: u32,
    canvas: web_sys::HtmlCanvasElement,
    ctx: web_sys::CanvasRenderingContext2d,
    tmp_canvas: web_sys::HtmlCanvasElement,
    tmp_ctx: web_sys::CanvasRenderingContext2d,
    buf: [u8; 2048],
}

const SLICE_WIDTH: f64 = 2.0 * f64::consts::PI / 2048.0;

impl Visualizer {
    fn draw(&self, i: u32) {
        // fetch drawing variables from window
        let step_factor = window().get("stepFactor").unwrap().as_f64().unwrap();
        let color_step_factor = window().get("colorStepFactor").unwrap().as_f64().unwrap();
        let opacity = window().get("opacity").unwrap().as_f64().unwrap();
        let radius = window().get("radius").unwrap().as_f64().unwrap();

        // save last frame to offscreen canvas with step_factor trimmed off
        self.tmp_ctx
            .draw_image_with_html_canvas_element_and_sw_and_sh_and_dx_and_dy_and_dw_and_dh(
                &self.canvas,
                self.width as f64 / step_factor,
                self.height as f64 / step_factor,
                self.width as f64 * (step_factor - 2.) / step_factor,
                self.height as f64 * (step_factor - 2.) / step_factor,
                0.,
                0.,
                self.width as f64,
                self.height as f64,
            )
            .unwrap();

        // clear canvas
        self.ctx.set_fill_style(&"rgb(0, 0, 0)".into());
        self.ctx
            .fill_rect(0., 0., f64::from(self.width), f64::from(self.height));

        // set color
        self.ctx.set_fill_style(
            &format!(
                "rgb({}, {}, {})",
                (i as f64 / color_step_factor / 5.).sin() * 127.5 + 127.5,
                (i as f64 / color_step_factor / 3.).sin() * 127.5 + 127.5,
                (i as f64 / color_step_factor).sin() * 127.5 + 127.5,
            )
            .into(),
        );

        // draw old frame with opacity
        self.ctx.set_global_alpha(opacity);
        self.ctx
            .draw_image_with_html_canvas_element(&self.tmp_canvas, 0., 0.)
            .unwrap();
        self.ctx.set_global_alpha(1.);

        // render new frame
        let mut theta = 0.;
        for i in 0..2048 {
            theta += SLICE_WIDTH;
            let amp = f64::from(self.buf[i]) / 256.0;

            let r = amp * self.height as f64 * 0.2 + self.height as f64 * 0.09;

            let x = f64::from(self.width / 2) + theta.cos() * r;
            let y = f64::from(self.height / 2) + theta.sin() * r;

            self.ctx.begin_path();
            self.ctx
                .arc(x, y, radius, 0., 2. * f64::consts::PI)
                .unwrap();
            self.ctx.fill();
        }
    }
}

#[wasm_bindgen]
pub async fn run() -> Result<(), JsValue> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));

    let analyser = load_and_play_file().await?;

    let document = web_sys::window().unwrap().document().unwrap();

    let canvas = document.get_element_by_id("canvas").unwrap();
    let canvas: web_sys::HtmlCanvasElement = canvas
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .map_err(|_| ())
        .unwrap();

    let context = canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<web_sys::CanvasRenderingContext2d>()
        .unwrap();

    let tmp_canvas = document.create_element("canvas").unwrap();
    let tmp_canvas: web_sys::HtmlCanvasElement = tmp_canvas
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .map_err(|_| ())
        .unwrap();

    tmp_canvas.set_width(canvas.width());
    tmp_canvas.set_height(canvas.height());

    let tmp_context = tmp_canvas
        .get_context("2d")
        .unwrap()
        .unwrap()
        .dyn_into::<web_sys::CanvasRenderingContext2d>()
        .unwrap();

    let mut vis = Visualizer {
        height: canvas.height(),
        width: canvas.width(),
        canvas: canvas,
        ctx: context,
        tmp_canvas: tmp_canvas,
        tmp_ctx: tmp_context,
        buf: [0; 2048],
    };

    let f = Rc::new(RefCell::new(None));
    let g = f.clone();

    let mut i = 0;
    *g.borrow_mut() = Some(Closure::wrap(Box::new(move || {
        i += 1;
        analyser.get_byte_time_domain_data(&mut vis.buf);
        vis.draw(i);

        // Schedule ourself for another requestAnimationFrame callback.
        request_animation_frame(f.borrow().as_ref().unwrap());
    }) as Box<dyn FnMut()>));
    request_animation_frame(g.borrow().as_ref().unwrap());

    Ok(())
}
