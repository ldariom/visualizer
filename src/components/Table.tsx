import { Cell, Column, Table2 } from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";
import React from "react";
export const Table = () => {

    const dollarCellRenderer = (rowIndex: number) => (
        <Cell>{`$${(rowIndex * 10).toFixed(2)}`}</Cell>
    );
    const euroCellRenderer = (rowIndex: number) => (
        <Cell>{`€${(rowIndex * 10 * 0.85).toFixed(2)}`}</Cell>
    );
    
  return (
    <div>
    <Table2 numRows={10}>
        <Column name="Dollars" cellRenderer={dollarCellRenderer}/>
        <Column name="Euros" cellRenderer={euroCellRenderer} />
    </Table2>
    </div>
  )
}
