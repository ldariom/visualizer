import { HTMLTable } from "@blueprintjs/core";
import React, { useState } from "react";
import "@blueprintjs/table/lib/css/table.css";

const trackList = [
  { name: "ARRABAL",  path: "audio/ARRABAL.mp3" },
  { name: "Present-perfect", path: "audio/Present-perfect.mp3" },
  { name: "Guitar", path: "audio/smooth-ac-guitar-loop-93bpm-137706.mp3" }
];

export const Table2 = (props: any) => {
  const [, setPathSelected] = useState('');
  const [refSelected, setRefSelected] = useState(100);

  const clickCell = (path: string, id: number) => {
    setRefSelected(id);
    setPathSelected(path);
    props.onValueChange(path);
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