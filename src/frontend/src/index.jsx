
import './index.scss';
import '@babel/polyfill';

import React from 'react';
import store from './store';
import { Provider } from 'react-redux';
import { render } from 'react-dom';

import CtMainPage from './views/ct-main-page';



// {
// 	store.subscribe
// 	(
// 		() =>
// 		{
// 			const
// 				{
// 					segmentation,

// 				} = store.getState();

// 			console.log(segmentation);
// 		}
// 	)
// }

const _render = (component) =>
	render
	(
		<Provider store={store}>
			{ component }
		</Provider>,

		document.getElementById('root'),
	);

_render(<CtMainPage />);
