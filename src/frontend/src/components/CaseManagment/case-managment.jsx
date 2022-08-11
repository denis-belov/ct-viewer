/*
eslint-disable

no-magic-numbers,
no-bitwise,
max-statements,
no-new,
*/



import React from "react";
// import { connect } from "react-redux";



export default class CaseManagment extends React.PureComponent
{

	render ()
	{
		const jsx =
		(
			<span className={this.props.className}>

				<span className="ct_frontend-title">
					CASE MANAGMENT
				</span>

				<select
					placeholder="SELECT LOCATION (RU/EN)"
					className="ct_frontend-dropdown"
				>
					<option
						valuedisabled={"disabled"}
						valueselected={"default"}
						hidden
					>
						SELECT LOCATION (RU/EN)
					</option>
					<option> RU </option>
					<option> EN </option>
				</select>

				<input
					placeholder="FILL PATIENT NUMBER"
					className="ct_frontend-dropdown"
				>
				</input>

				<button
					className="ct_frontend-button"

					onClick={() => document.querySelector('#data-input').click()}
				>
					LOAD
				</button>

				<button className="ct_frontend-button">
					SAVE
				</button>

			</span>
		);

		return jsx;
	}
}
