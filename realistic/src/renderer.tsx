import React from 'react'
import ReactDOM from 'react-dom/client'
import {ProjectHeader} from "./ProjectHeader";

console.log("Hello from 'renderer.tsx'!");
const root = document.getElementById("root");

export function Main() {
    return (<>
        <ProjectHeader/>
    </>)
}

ReactDOM.createRoot(root).render(<Main/>);
