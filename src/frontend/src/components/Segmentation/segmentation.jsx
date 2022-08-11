/*
eslint-disable

no-magic-numbers,
no-bitwise,
max-statements,
no-new,
*/

import React from 'react';
import { connect } from 'react-redux';
import ReactSlider from 'react-slider';
import * as actions from '../../actions';

class Segmentation extends React.PureComponent
{

	render()
	{
		const jsx =
		(
			<span className={this.props.className}>

				<span className='ct_frontend-title_with_toogle'>

					<span className='ct_frontend-title'>
						SEGMENTATION
					</span>
					<label className='ct_frontend-toogle'>
						<input
							type='checkbox'
							checked = {this.props.segmentation ? true : false }
							onChange = { () => this.props.toggleSegmentation() }
						/>
						<span></span>
					</label>

				</span>

				<span className='ct_frontend-instrument_box'>

					<span className='ct_frontend-instrument'>
						<span className='ct_frontend-title'> INSTRUMENT </span>
						<select className='ct_frontend-dropdown'>
						<option> 3D ROUND BRUSH </option>
						<option> 3d round brush </option>
						</select>
					</span>

					<span className='ct_frontend-instrument'>
						<span className='ct_frontend-title'> BRUSH SIZE </span>
						<ReactSlider
							className="ct_frontend-horizontal_slider"
							thumbclassName="ct_frontend-horizontal_slider-thumb"
							trackclassName="ct_frontend-horizontal_slider-track"
							renderThumb = {(props, state) => <div {...props}>{state.valueNow}</div>}
							renderTrack = {(props, state) => <div {...props}></div>}
						/>
					</span>

					<span className='ct_frontend-instrument'>
						<span className='ct_frontend-title'> TRANSPARENCY </span>
						<ReactSlider
							className="ct_frontend-horizontal_slider"
							thumbClassName="ct_frontend-horizontal_slider-thumb"
							trackClassName="ct_frontend-horizontal_slider-track"
							renderThumb = {(props, state) => <div {...props}>{state.valueNow}</div>}
							renderTrack = {(props, state) => <div {...props} index={state.index}/>}
						/>
					</span>

					<button onClick={() => window.doMarchingCubes()} className='ct_frontend-button'> UPDATE MESH </button>
				</span>

			</span>
		);

	return jsx;
	}

}

const mapStateToProps = (props) => props;

const mapDispatchToProps = (dispatch) =>
	({
		toggleSegmentation: () => dispatch({ type: actions.TOGGLE_SEGMENTATION }),
	});

export default connect(mapStateToProps, mapDispatchToProps)(Segmentation);