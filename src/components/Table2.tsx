import { Cell, Column, Table2 as Table } from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import { useState } from "react";
import React from "react";

const stocks = [
  { name: "ARRABAL",  path: "audio/ARRABAL.mp3" },
  { name: "Present-perfect", path: "audio/Present-perfect.mp3" },
  { name: "Guitar", path: "audio/smooth-ac-guitar-loop-93bpm-137706.mp3" }
];

export const Table2 = (props: any) => {
  const [, setPathSelected] = useState('');

const clickCell = (path: string) => {
  setPathSelected(path);
  props.onValueChange(path);
}
  return (
    <div>
      <Table 
      enableGhostCells={false} 
      enableMultipleSelection={false} 
      enableRowResizing={false}
      enableRowHeader={false}
      numRows={stocks.length}>
        <Column name="" cellRenderer={(i) => 
        <Cell interactive={true}>
          <div onClick={ () => clickCell(stocks[i].path) }>{stocks[i].name}</div>
        </Cell>}>
      </Column>
      </Table>
    </div>
  );
};