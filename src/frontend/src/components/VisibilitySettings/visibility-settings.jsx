/*
eslint-disable

no-magic-numbers,
no-bitwise,
max-statements,
no-new,
*/

import React from 'react';
import { connect } from 'react-redux';

export default class VisibilitySettings extends React.PureComponent
{

	render()
	{
		const jsx =
		(
			<span className={this.props.className}>

				<span className={'ct_frontend-title'}>
					VISIBILITY SETTINGS
				</span>
				<span className={this.props.className + '-visibility_table'}>
					<table>
						<thead>
							<tr>
								<th> SELECTION</th>
								<th> SEGMENTATION </th>
								<th> MESH </th>
								<th> COLOR </th>
								<th> VISIBILITY </th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td> 1 </td>
								<td> 2 </td>
								<td> 3 </td>
								<td> 4 </td>
								<td> 5 </td>
							</tr>
							<tr>
								<td> 1 </td>
								<td> 2 </td>
								<td> 3 </td>
								<td> 4 </td>
								<td> 5 </td>
							</tr>
							<tr>
								<td> 1 </td>
								<td> 2 </td>
								<td> 3 </td>
								<td> 4 </td>
								<td> 5 </td>
							</tr>
						</tbody>
					</table>
				</span>
			</span>
		);

	return jsx;
	}

}

