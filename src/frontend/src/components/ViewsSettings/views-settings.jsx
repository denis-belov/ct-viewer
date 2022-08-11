/*
eslint-disable

no-magic-numbers,
no-bitwise,
max-statements,
no-new,
*/

import React from 'react';
import { connect } from 'react-redux';

const img = (src) => require(`./icons/${ src }`);

class ViewsSettings extends React.PureComponent
{

	render()
	{
		const jsx =
		(
			<span className={this.props.className}>

				<span className={'ct_frontend-title'}>
					VIEWS SETTINGS
				</span>

				<span className='ct_frontend-instrument_box'>
					<span className={this.props.className + '-grid'}>
						<span className='ct_frontend-img_block'>
							<img className='ct_frontend-icon' src = {this.props.only_3d ? img('ok.svg') : img('black_x.svg')} />
							3D ONLY
						</span>

						<span className='ct_frontend-img_block'>
							<img className='ct_frontend-icon' src = {this.props.only_axial ? img('ok.svg') : img('black_x.svg')} />
							AXIAL ONLY
						</span>

						<span className='ct_frontend-img_block'>
							<img className='ct_frontend-icon' src = {this.props.seg_and_3d ? img('ok.svg') : img('black_x.svg')} />
							3D + SEG
						</span>

						<span className='ct_frontend-img_block'>
							<img className='ct_frontend-icon' src = {this.props.only_saggital ? img('ok.svg') : img('black_x.svg')} />
							SAGGITAL ONLY
						</span>
					</span>
				</span>
			</span>
		);

	return jsx;
	}

}

const mapStateToProps = (props) => props;

const mapDispatchToProps = (dispatch) =>
	({

	});

export default connect(mapStateToProps, mapDispatchToProps)(ViewsSettings);
