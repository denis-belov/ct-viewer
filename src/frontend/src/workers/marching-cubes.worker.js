import vtkMapper             from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkImageMarchingCubes from 'vtk.js/Sources/Filters/General/ImageMarchingCubes';
import vtkDataArray          from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData          from 'vtk.js/Sources/Common/DataModel/ImageData';



// vtk.js uses window object
global.window = global;

const mapper = vtkMapper.newInstance();

const marching_cubes = vtkImageMarchingCubes.newInstance({ contourValue: 0.5 });
marching_cubes.setMergePoints(false);
marching_cubes.setComputeNormals(false);



onmessage = (message) =>
{
	const scalars =
		vtkDataArray.newInstance
		({
			values: message.data.data,
			numberOfComponents: 1,
			dataType: vtkDataArray.VtkDataTypes.CHAR,
			name: 'scalars'
		});

	const image_data = vtkImageData.newInstance();
	// image_data.setOrigin(0, 0, 0);
	image_data.setSpacing(...message.data.spacing);
	image_data.setExtent(...message.data.extent);
	image_data.getPointData().setScalars(scalars);

	marching_cubes.setInputData(image_data);
	mapper.setInputData(marching_cubes.getOutputData());

	const points = mapper.getInputData().get().points.get().values;
	const polys = mapper.getInputData().get().polys.get().values;

	const center = [ 0, 0, 0 ];

	for (let i = 0; i < points.length; i += 3)
	{
		center[0] += points[i + 0];
		center[1] += points[i + 1];
		center[2] += points[i + 2];
	}

	center[0] /= points.length / 3;
	center[1] /= points.length / 3;
	center[2] /= points.length / 3;

	for (let i = 0; i < points.length; i += 3)
	{
		points[i + 0] -= center[0];
		points[i + 1] -= center[1];
		points[i + 2] -= center[2];
	}

	const _polys = new Uint32Array(polys.length / 4 * 3);

	for (let i = 0; i < _polys.length; i += 3)
	{
		const poly_index = i / 3 * 4;

		// (poly_index + 0) is not a point, so start from (poly_index + 1)
		_polys[i + 0] = polys[poly_index + 1];
		_polys[i + 1] = polys[poly_index + 2];
		_polys[i + 2] = polys[poly_index + 3];
	}

	postMessage({ points, polys: _polys });
};
