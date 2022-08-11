import React from 'react';
import { connect } from 'react-redux';

export default class CanvasComponent extends React.PureComponent
{
	render ()
	{
		const jsx =
		(
			<div className={`${ this.props.className } canvas-cell`} id={this.props.id}/>
		);

		return jsx;
	}
}
