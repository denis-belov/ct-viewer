import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkImageMarchingCubes from 'vtk.js/Sources/Filters/General/ImageMarchingCubes';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';



const mapper = vtkMapper.newInstance();

const marching_cubes = vtkImageMarchingCubes.newInstance({ contourValue: 0.5 });
marching_cubes.setMergePoints(false);
marching_cubes.setComputeNormals(false);

var VtkDataTypes = vtkDataArray.VtkDataTypes;



onmessage = (message) =>
{
	var scalars =
		vtkDataArray.newInstance
		({
			values: message.data.data,
			numberOfComponents: 1,
			dataType: VtkDataTypes.CHAR,
			name: 'scalars'
		});

	const image_data = vtkImageData.newInstance();
	image_data.setOrigin(0, 0, 0);
	image_data.setSpacing(...message.data.spacing);
	image_data.setExtent(...message.data.extent);
	image_data.getPointData().setScalars(scalars);

	marching_cubes.setInputData(image_data);
	mapper.setInputData(marching_cubes.getOutputData());

	const points = mapper.getInputData().get().points.get().values;
	const polys = mapper.getInputData().get().polys.get().values;

	postMessage({ points, polys });
};
