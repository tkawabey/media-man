import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../i18n/configs'; //i18
import { HashRouter} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';



const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <HashRouter basename="/">
      <App />
    </HashRouter>
  </React.StrictMode>
);

// // calling IPC exposed from preload script
// window.electron.ipcRenderer.once('ipc-example', (arg) => {
//   // eslint-disable-next-line no-console
//   console.log(arg);
// });
// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
