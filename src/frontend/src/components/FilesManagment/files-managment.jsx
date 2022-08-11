/*
eslint-disable

no-magic-numbers,
no-bitwise,
max-statements,
no-new,
*/

import React from 'react';
import { connect } from 'react-redux';

export default class FilesManagment extends React.PureComponent
{

	render()
	{
		const jsx =
		(
			<span className ={this.props.className} >


				<span className='ct_frontend-title'>
					FILES MANAGMENT
				</span>

				<span className='ct_frontend-instrument_box'>
					<button className='ct_frontend-button'> LOAD CT SCAN </button>
					<button className='ct_frontend-button'> LOAD SEGMENTATION </button>
					<button className='ct_frontend-button'> LOAD REFERENCE MESH </button>
					<button className='ct_frontend-button'> SAVE </button>
				</span>

			</span>
		);

	return jsx;
	}

}

