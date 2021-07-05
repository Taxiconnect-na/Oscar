import styled from 'styled-components';



export const Table = styled.table`
    width: 100%;
`

export const InnerTable = styled.table`
    border: 1px solid black;
    border-collapse: collapse;
    width: 100%;
`

export const InnerTH = styled.th`
    border: 1px solid black;
    border-collapse: collapse;
    padding: 5px;
    text-align: left; 
`

export const InnerTH2 = styled.th.attrs({
  colSpan: 2
})`
    border: 1px solid black;
    border-collapse: collapse;
    padding: 5px;
    text-align: left; 
`

export const InnerTD = styled.td`
  border: 1px solid black;
  border-collapse: collapse;
  padding: 5px;
  text-align: left; 

`

export const InnerTD2 = styled.td.attrs({
  rowSpan: 4
})`
  border: 1px solid black;
  border-collapse: collapse;
  padding: 5px;
  text-align: left; 

`

export const TR = styled.tr`
   width: 100%;
`
export const TR2 = styled.tr.attrs({
  colSpan: 8
})`
   width: 100%;
`