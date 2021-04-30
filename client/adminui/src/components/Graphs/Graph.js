import React, { PureComponent } from 'react';
import { Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart } from 'recharts';

const data = [
    {
      date: '2000-01',
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      date: '2000-02',
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      date: '2000-03',
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      date: '2000-04',
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      date: '2000-05',
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      date: '2000-06',
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      date: '2000-07',
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },

];

const monthTickFormatter = (tick) => {
    const date = new Date(tick);
  
    return date.getMonth() + 1;
};
  


export default function Graph() {
    const styles = {
        graph: {
            width: "100%",
            margin: "3%"
        }
    }
  return (
    <div>
        <div style={styles.graph}>
        <BarChart width={730} height={250} data={data}>
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pv" fill="#8884d8" />
            <Bar dataKey="uv" fill="#82ca9d" />
        </BarChart>
        </div>

    </div>
  )
}

/*
export default function Graph() {
    return (
      <div>
          
          <BarChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={monthTickFormatter} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={renderQuarterTick}
              height={1}
              scale="band"
              xAxisId="quarter"
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pv" fill="#8884d8" />
            <Bar dataKey="uv" fill="#82ca9d" />
          </BarChart>
  
      </div>
    )
}








export default class Example extends PureComponent {
  

  render() {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={monthTickFormatter} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={renderQuarterTick}
            height={1}
            scale="band"
            xAxisId="quarter"
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pv" fill="#8884d8" />
          <Bar dataKey="uv" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
}

*/