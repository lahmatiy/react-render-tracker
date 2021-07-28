// import { getSubscriber } from "rempl";
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';

import './index.scss';

// getSubscriber().subscribe(data => {
//   document.body.innerHTML = data;
// });

document.body.innerHTML = `<div id="root"></div>`;

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
