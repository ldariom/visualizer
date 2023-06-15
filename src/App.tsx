import { FileInput, FormGroup, Slider } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import React, { useEffect, useState } from "react";
import { Table2 } from "./components/Table";
import init from "wasm";

declare global {
  interface Window { bf: Uint8Array | {}; }
}

window.bf = window.bf || {};

const fetchData = async (path: string) => {
  const response = await fetch(path);
  const rawData = await response.arrayBuffer();

  const rust_input_Uint8Array = new Uint8Array(rawData);
  
  window.bf = rust_input_Uint8Array;
};

const App: React.FC = () => {
  const [file, setFile] = useState<File>();
  const [stateUpload, setResponseUpload] = useState<{ message: string; list?: Array<string>; flag: boolean } | null>(null);
  const [stepFactor, setStepFactor] = useState(160);
  const [colorStepFactor, setColorStepFactor] = useState(100);
  const [opacity, setOpacity] = useState(0.95);
  const [radius, setRadius] = useState(4);
  const [pathSelected, setPathSelected] = useState("");

  useEffect(() => {
    // @ts-ignore
    window.stepFactor = stepFactor;
  }, [stepFactor]);

  useEffect(() => {
    // @ts-ignore
    window.opacity = opacity;
  }, [opacity]);

  useEffect(() => {
    // @ts-ignore
    window.radius = radius;
  }, [radius]);

  useEffect(() => {
    // @ts-ignore
    window.colorStepFactor = 199 - colorStepFactor;
  }, [colorStepFactor]);

  useEffect(() => {
    if (file == null) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then( setResponseUpload )
    .catch(err => console.error(err));

  }, [file]);
  
  console.log(stateUpload);

  useEffect(() => {
    if (pathSelected !== null) {
   
      const t0 = performance.now();
      fetchData(pathSelected).then(() => {
        const t1 = performance.now();
        init().then((mod) => {
          mod.run();
          const t1 = performance.now();
          console.log(`playing song took ${t1 - t0} milliseconds.`);
        });
      });
    }
  }, [pathSelected]);

  return (
    <div
      className="bp3-dark"
      style={{
        background: "#0f0e17",
        display: "grid",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <div
        id="full-screen"
        style={{
          position: "absolute",
          right: "50px",
          top: "50px",
        }}
      >
        <FormGroup
            helperText="Controls speed of radial fade"
            label="Radial Step Factor"
            labelFor="text-input"
        >
          <Slider
            min={50}
            max={400}
            stepSize={10}
            labelStepSize={100}
            value={stepFactor}
            onChange={setStepFactor}
          />
        </FormGroup>

        <FormGroup
            helperText="Controls speed of color change"
            label="Color Step Factor"
            labelFor="text-input"
        >
          <Slider
            min={1}
            max={200}
            stepSize={10}
            labelStepSize={100}
            value={colorStepFactor}
            onChange={setColorStepFactor}
          />
        </FormGroup>

        <FormGroup
            helperText="Controls opacity of old frames"
            label="Opacity Decay"
            labelFor="text-input"
        >
          <Slider
            min={.5}
            max={1}
            stepSize={0.01}
            labelStepSize={0.25}
            value={opacity}
            onChange={setOpacity}
          />
        </FormGroup>
        <FormGroup
            helperText="Controls size of waveform"
            label="Waveform Radius"
            labelFor="text-input"
        >
          <Slider
            min={0}
            max={20}
            stepSize={1}
            labelStepSize={10}
            value={radius}
            onChange={setRadius}
          />
        </FormGroup>

        <h3>Upload audio file</h3>
        <FileInput
          style={{ width: "250px" }}
          inputProps={{ accept: "audio/*", id: "file-input" }}
          onChange={(e) => {
            // @ts-ignore
            const file = e.target.files[0];
            setFile(file);
          }}
        />

        <h3 style={{ marginTop: "30px" }}>Select tracks</h3>

        <Table2 soundList={stateUpload} onValueChange={ setPathSelected }></Table2>

      </div>

      <canvas
        id="canvas"
        style={{
          height: "100%",
          width: "100%",
        }}
        height={window.innerHeight * window.devicePixelRatio}
        width={window.innerWidth * window.devicePixelRatio}
      ></canvas>
    </div>
  );
};

export default App;
