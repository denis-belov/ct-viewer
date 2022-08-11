import React from 'react';

import CanvasComponent from '../../components/CanvasComponent/canvas-component';
// import FilesManagment from '../../components/FilesManagment/files-managment';
import CaseManagment from '../../components/CaseManagment/case-managment';
import ViewsSettings from '../../components/ViewsSettings/views-settings';
import VisibilitySettings from '../../components/VisibilitySettings/visibility-settings'
import Segmentation from '../../components/Segmentation/segmentation';
import Sculpting from '../../components/Sculpting/sculpting';

import presentImage from '../..//js/present-image';



export default class CtMainPage extends React.PureComponent
{
	render ()
	{
		const jsx =
		(
			<div className='ct_frontend'>
				<CaseManagment className="ct_frontend-case_managment" />
				<VisibilitySettings className="ct_frontend-visibility_settings" />
				<ViewsSettings className="ct_frontend-view_settings" />
				<Segmentation className="ct_frontend-segmentation" />
				<Sculpting className="ct_frontend-sculpting" />

				<div className="ct_frontend-canvas_panel">
					<CanvasComponent className="ct_frontend-canvas_panel-canvas-comp1" id="i" />
					<CanvasComponent className="ct_frontend-canvas_panel-canvas-comp2" id="j" />
					<CanvasComponent className="ct_frontend-canvas_panel-canvas-comp3" id="k" />
					<CanvasComponent className="ct_frontend-canvas_panel-canvas-comp4" id="sculpt" />
				</div>

				<input
					type="file"
					id="data-input"
					style={{ display: 'none' }}

					multiple

					onChange={async (evt) =>
					{
						// const { image } = await window.itk.readImageFile(null, evt.target.files[0]);

						// const itk_image = image;

						// const vtk_image = ITKHelper.convertItkToVtkImage(itk_image);

						// presentImage(vtk_image);

						presentImage(evt.target.files);
					}}
				/>
			</div>
		);

		return jsx;
	};
}
