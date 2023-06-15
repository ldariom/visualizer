import { HTMLTable } from "@blueprintjs/core";
import React, { useState } from "react";

let trackList = [
  { name: "GUITAR-LOOP.mp3",  path: "audio/GUITAR-LOOP.mp3" }
];

export const Table2 = (props: any) => {
  const [, setPathSelected] = useState('');
  const [refSelected, setRefSelected] = useState(100);

  const clickCell = (path: string, id: number) => {
    setRefSelected(id);
    setPathSelected(path);
    props.onValueChange(path);
  }
  if (props.soundList?.list) {
    const transformList = props.soundList.list.map((item: string) => ({ name: item, path: `audio/${item}` }) );
    trackList = [...trackList, ...transformList].filter((value, index, self) => index === self.findIndex((t) => ( t.name === value.name)));
  }

  return (
    <>
      <HTMLTable bordered={true}>
        <tbody>
        {trackList.map((track: { name: string; path: string}, index) => {     
           return (<tr key={ index }><td className={ index == refSelected ? 'selected' : ''} onClick={ () => clickCell(track.path, index) }> { track.name }</td></tr>) 
        })}
        </tbody>
    </HTMLTable>
    </>
  );
};