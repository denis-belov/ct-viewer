/*
eslint-disable

no-magic-numbers,
no-bitwise,
max-statements,
no-new,
*/

import React from 'react';
import { connect } from 'react-redux';
import ReactSlider from 'react-slider'

export default class Sculpting extends React.PureComponent
{

	render()
	{
		const jsx =
		(
			<span className={this.props.className}>

				<span className='ct_frontend-title'>
					SCULPTING
				</span>

				<span className='ct_frontend-instrument_box'>

					<span className='ct_frontend-instrument'>
						<span className='ct_frontend-title'> INSTRUMENT </span>
						<select className='ct_frontend-dropdown'>
							<option> Smooth (-SHIFT) </option>
						</select>
					</span>

					<span className='ct_frontend-instrument'>
						<span className='ct_frontend-title'> RADIUS </span>
						<ReactSlider
							className="ct_frontend-horizontal_slider"
							thumbClassName="ct_frontend-horizontal_slider-thumb"
							renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
						/>
					</span>

					<span className='ct_frontend-instrument'>
						<span className='ct_frontend-title'> INTENSITY </span>
						<ReactSlider
							className="ct_frontend-horizontal_slider"
							thumbClassName="ct_frontend-horizontal_slider-thumb"
							renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
						/>
					</span>

					<button className='ct_frontend-button'> UPDATE VOLUME </button>

				</span>

			</span>
		);

	return jsx;
	}

}

