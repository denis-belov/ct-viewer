import * as dat from 'dat.gui';

import catmullClark from 'gl-catmull-clark';

import vtkRenderer               from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow           from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkImageMapper            from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice             from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkColorTransferFunction  from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkOpenGLRenderWindow     from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPaintFilter            from 'vtk.js/Sources/Filters/General/PaintFilter';
import vtkWidgetManager          from 'vtk.js/Sources/Widgets/Core/WidgetManager';
import { ViewTypes }             from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import vtkPaintWidget            from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget';
import vtkInteractorStyleImage   from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import ITKHelper                 from 'vtk.js/Sources/Common/DataModel/ITKHelper';
import vtkPiecewiseFunction      from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

import MarchingCubesWorker from 'worker-loader!../workers/marching-cubes.worker.js';

import { WebGL } from '../../../../../../3d-smile/3d-smile-glkit/src/index';
import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import SubdivisionModifier from 'three-subdivision-modifier';



const marching_cubes_worker = new MarchingCubesWorker();

export default async (file) =>
{
	// const { image } = await window.itk.readImageFile(null, file);
	LOG(file)

	const { image } = await window.itk.readImageDICOMFileSeries(file);

	const itk_image = image;

	const vtk_image = ITKHelper.convertItkToVtkImage(itk_image);

	const data = vtk_image;

	LOG(data)



	const dat_gui = new dat.GUI();



	const data_range = data.getPointData().getScalars().getRange();
	const data_extent = data.getExtent();

	const render_windows = [];
	const cameras = [];
	const image_actors = [];
	const paint_widgets = [];

	const painter = vtkPaintFilter.newInstance();
	painter.setBackgroundImage(data);
	// Setting slicing mode to not NULL value enables 2D painting.
	// painter.setSlicingMode(0);
	painter.setLabel(1);
	// data_spacing = painter.getLabelMap().getSpacing();
	// LOG(painter.get())

	const painter_output_port = painter.getOutputPort();



	const gui_options =
	{
		i: 0,
		j: 0,
		k: 0,
		radius: 1,
		'color window': data_range[1],
		'color level': (data_range[0] + data_range[1]) * 0.5,
		scale: 100,
	};

	const gui_folder_slices = dat_gui.addFolder('Sices');
	gui_folder_slices.open();

	const gui_folder_drawing = dat_gui.addFolder('Drawing');
	gui_folder_drawing.open();

	const gui_folder_settings = dat_gui.addFolder('Settings');
	gui_folder_settings.open();

	let data_spacing = data.getSpacing();
	let painter_radius2 = data_spacing.map((s) => gui_options.radius / s);

	const gui =
		gui_folder_drawing
			.add(gui_options, 'radius', 0.1, 10, 0.1)
			.onChange
			(
				(value) =>
				{
					paint_widgets.forEach((_) => _.setRadius(value));

					painter.setRadius(value);

					painter_radius2 = data_spacing.map((s) => value / s);
				},
			);

	painter.setRadius(gui.object.radius);



	const setCamera = (sliceMode, renderer, data, paint_handle) =>
	{
		const ijk = [0, 0, 0];
		const position = [0, 0, 0];
		const focalPoint = [0, 0, 0];
		data.indexToWorld(ijk, focalPoint);
		ijk[sliceMode] = 1;
		data.indexToWorld(ijk, position);
		paint_handle.getWidgetState().getHandle().setDirection(ijk);
		paint_handle.get().manipulator.setNormal(ijk);
		renderer.getActiveCamera().set({ focalPoint, position });

		// LOG(renderer.getActiveCamera().setParallelScale)
		renderer.resetCamera();

		renderer.getActiveCamera().setParallelScale(gui_options.scale);
	};



	document.querySelectorAll('#i, #j, #k').forEach
	(
		({ id }) =>
		{
			const view = id;

			const VIEW = view.toUpperCase();

			const index = vtkImageMapper.SlicingMode[VIEW];

			const container = document.querySelector(`#${ view }`);

			const renderer = vtkRenderer.newInstance();

			const camera = renderer.getActiveCamera();
			camera.setParallelProjection(true);
			cameras.push(camera);
			// LOG(camera.scale(2))
			// // LOG(camera)
			// camera.dolly(2);
			// camera.modified();

			const render_window = vtkRenderWindow.newInstance();
			render_window.addRenderer(renderer);
			render_windows.push(render_window);

			// setTimeout
			// (
			// 	() =>
			// 	{
			// 		camera.setParallelScale(1);
			// 		render_window.render();
			// 	},

			// 	3000,
			// );

			const opengl_render_window = vtkOpenGLRenderWindow.newInstance();
			opengl_render_window.setContainer(container);
			opengl_render_window.setSize(container.offsetWidth, container.offsetHeight);
			render_window.addView(opengl_render_window);

			const interactor_style = vtkInteractorStyleImage.newInstance();
			interactor_style.setInteractionMode('IMAGE_SLICING');

			const interactor = vtkRenderWindowInteractor.newInstance();
			interactor.setView(opengl_render_window);
			interactor.setInteractorStyle(interactor_style);
			interactor.initialize();
			interactor.bindEvents(container);

			const image_mapper = vtkImageMapper.newInstance();
			image_mapper.setInputData(data);
			image_mapper.setSlicingMode(index);
			image_mapper.setSlice(0);
			// LOG(image_mapper)

			const image_actor = vtkImageSlice.newInstance();
			image_actor.setMapper(image_mapper);
			image_actor.getProperty().setColorWindow(gui.object['color window']);
			image_actor.getProperty().setColorLevel(gui.object['color level']);
			image_actors.push(image_actor);
			LOG(image_actor.setScale)
			// image_actor.setScale([ 2, 2, 2 ]);

			renderer.addActor(image_actor);



			const segment_mapper = vtkImageMapper.newInstance();
			segment_mapper.setInputConnection(painter_output_port);
			segment_mapper.setSlicingMode(index);
			segment_mapper.setSlice(0);

			const cfun = vtkColorTransferFunction.newInstance();
			cfun.addRGBPoint(index + 1, 1, 1, 1);

			const ofun = vtkPiecewiseFunction.newInstance();
			ofun.addPoint(0, 0); // our background value, 0, will be invisible
			ofun.addPoint(1, 1); // all values above 1 will be fully opaque

			const segment_actor = vtkImageSlice.newInstance();
			segment_actor.setMapper(segment_mapper);
			segment_actor.getProperty().setOpacity(0.5);
			segment_actor.getProperty().setRGBTransferFunction(cfun);
			segment_actor.getProperty().setPiecewiseFunction(ofun);
			// segment_actor.setScale([ 2, 2, 2 ]);
			// segment_actor.getProperty().setColorWindow(gui.object['color window']);
			// segment_actor.getProperty().setColorLevel(gui.object['color level']);
			// segment_actor.getProperty().setDiffuse(1);

			renderer.addActor(segment_actor);

			const widget_manager = vtkWidgetManager.newInstance();
			widget_manager.setRenderer(renderer);
			widget_manager.enablePicking();

			const paint_widget = vtkPaintWidget.newInstance();
			paint_widget.setRadius(gui.object.radius)
			paint_widgets.push(paint_widget);
			// paint_widget.getManipulator().setOrigin([ 0, 0, 0 ]);
			const paint_handle = widget_manager.addWidget(paint_widget, ViewTypes.SLICE);

			widget_manager.grabFocus(paint_widget);

			// LOG(paint_widget.get(), paint_handle.get())

			paint_handle.get().subscribedEvents.slice(1).forEach((_) => _.unsubscribe());

			// paint_handle.setVisibility('paint_widget');
			// paint_handle.updateRepresentationForRender();

			{
				const buffer = painter.getLabelMap().getPointData().getScalars().getData();
				const dimensions = painter.getLabelMap().getDimensions();
				const indexPt = [ 0, 0, 0 ];

				const yStride = dimensions[0];
				const zStride = dimensions[0] * dimensions[1];

				const dimensions2m1 = dimensions[2] - 1;
				const dimensions1m1 = dimensions[1] - 1;
				const dimensions0m1 = dimensions[0] - 1;

				// const handlePaintEllipse = (center) =>
				// {
				// 	const zmin = Math.round(Math.max(center[2] - painter_radius2[2], 0));
				// 	const zmax = Math.round(Math.min(center[2] + painter_radius2[2], dimensions2m1));

				// 	for (let z = zmin; z <= zmax; ++z)
				// 	{
				// 		const dz = (center[2] - z) / painter_radius2[2];
				// 		const dzdz = dz * dz;
				// 		const ay = painter_radius2[1] * Math.sqrt(1 - dzdz);

				// 		const ymin = Math.round(Math.max(center[1] - ay, 0));
				// 		const ymax = Math.round(Math.min(center[1] + ay, dimensions1m1));

				// 		const z_zStride = z * zStride;

				// 		for (let y = ymin; y <= ymax; ++y)
				// 		{
				// 			const dy = (center[1] - y) / painter_radius2[1];
				// 			const ax = painter_radius2[0] * Math.sqrt(1 - dy * dy - dzdz);

				// 			const xmin = Math.round(Math.max(center[0] - ax, 0));
				// 			const xmax = Math.round(Math.min(center[0] + ax, dimensions0m1));

				// 			// LOG(xmax - xmin)

				// 			if (xmin <= xmax)
				// 			{
				// 				const index = y * yStride + z_zStride;

				// 				// buffer.fill(1, index + xmin, index + xmax + 1);

				// 				buffer.subarray(index + xmin, index + xmax + 1).fill(1);
				// 			}
				// 		}
				// 	}
				// }

				const painter_mask_to_world_index = painter.getMaskWorldToIndex();
				const painer_label_map = painter.getLabelMap();
				const scalars = painer_label_map.getPointData().getScalars();

				// 0: 4
				// 1: -0
				// 2: -0
				// 3: -0
				// 4: -0
				// 5: 4
				// 6: -0
				// 7: -0
				// 8: -0
				// 9: -0
				// 10: -4
				// 11: -0
				// 12: 4
				// 13: -0
				// 14: -536
				// 15: 1


				// LOG(painter_mask_to_world_index)

				// function transformMat4(out, a, m) {
				// 	out[0] = (m[0] * a[0] + m[12]);
				// 	out[1] = (m[5] * a[1] + m[13]);
				// 	out[2] = (m[10] * a[2] + m[14]);
				// }

				const addPoint = (point) =>
				{
					// LOG(vec3.transformMat4)
					// vec3.transformMat4(indexPt, point, painter_mask_to_world_index);

					// indexPt[0] = (m[0] * point[0] + m[12]);
					// indexPt[1] = (m[5] * point[1] + m[13]);
					// indexPt[2] = (m[10] * point[2] + m[14]);

					indexPt[0] = Math.round(painter_mask_to_world_index[0]  * point[0] + painter_mask_to_world_index[12]);
					indexPt[1] = Math.round(painter_mask_to_world_index[5]  * point[1] + painter_mask_to_world_index[13]);
					indexPt[2] = Math.round(painter_mask_to_world_index[10] * point[2] + painter_mask_to_world_index[14]);

					// handlePaintEllipse(indexPt);
					const zmin = Math.round(Math.max(indexPt[2] - painter_radius2[2], 0));
					const zmax = Math.round(Math.min(indexPt[2] + painter_radius2[2], dimensions2m1));

					for (let z = zmin; z <= zmax; ++z)
					{
						const dz = (indexPt[2] - z) / painter_radius2[2];
						const dzdz = dz * dz;
						const ay = painter_radius2[1] * Math.sqrt(1 - dzdz);

						const ymin = Math.round(Math.max(indexPt[1] - ay, 0));
						const ymax = Math.round(Math.min(indexPt[1] + ay, dimensions1m1));

						const z_zStride = z * zStride;

						for (let y = ymin; y <= ymax; ++y)
						{
							const dy = (indexPt[1] - y) / painter_radius2[1];
							const ax = painter_radius2[0] * Math.sqrt(1 - dy * dy - dzdz);

							const xmin = Math.round(Math.max(indexPt[0] - ax, 0));
							const xmax = Math.round(Math.min(indexPt[0] + ax, dimensions0m1));

							if (xmin <= xmax)
							{
								const index = y * yStride + z_zStride;

								buffer.fill(1, index + xmin, index + xmax + 1);

								// buffer.subarray(index + xmin, index + xmax + 1).fill(1);
							}
						}
					}

					// scalars.modified();
					// painer_label_map.modified();
					painter.modified();
				};

				const mousemove = () =>
				{
					addPoint(paint_widget.getWidgetState().getTrueOrigin());
				};

				container.addEventListener
				(
					'mousedown',

					() =>
					{
						painter.addPoint(paint_widget.getWidgetState().getTrueOrigin());

						window.addEventListener('mousemove', mousemove);
					},
				);

				window.addEventListener
				(
					'mouseup',

					() =>
					{
						window.removeEventListener('mousemove', mousemove);
					},
				);

				container.addEventListener
				(
					'mouseup',

					() =>
					{
						window.removeEventListener('mousemove', mousemove);
					},
				);
			}

			marching_cubes_worker.onmessage = (message) =>
			{

				// const geometry = BufferGeometryUtils.mergeVertices(new THREE.BoxGeometry(10, 10, 10, 10, 10, 10));
				// LOG(new THREE.BoxGeometry(10, 10, 10, 10, 10, 10))
				// LOG(geometry)

				const geometry = new THREE.BufferGeometry();

				geometry.setAttribute('position', new THREE.BufferAttribute(message.data.points, 3, false));
				geometry.setIndex(new THREE.BufferAttribute(message.data.polys, 1));

				const geometry2 = BufferGeometryUtils.mergeVertices(geometry);

				LOG(geometry, geometry2)

				// const points = message.data.points;
				const points = geometry2.attributes.position.array;

				// const cc_points = [];
				// const cc_tri = [];

				// for (let i = 0; i < points.length; i += 3)
				// {
				// 	cc_points.push([ points[i + 0], points[i + 1], points[i + 2] ]);
				// }

				// // const polys = message.data.polys;
				const polys = new Uint32Array(geometry2.index.array);

				// // for (let i = 0; i < polys.length; i += 3)
				// for (let i = 0; i < polys.length; i += 3)
				// {
				// 	// cc_tri.push([ polys[i + 1], polys[i + 2], polys[i + 3] ]);
				// 	cc_tri.push([ polys[i + 0], polys[i + 1], polys[i + 2] ]);
				// }

				// LOG(polys)

				// const smooth = catmullClark(cc_points, cc_tri, 1, true);

				// LOG(smooth)



				const divisions = 2;
				const modifier = new SubdivisionModifier(divisions);

				geometry2.vertices = [];
				geometry2.faces = [];

				for (let i = 0; i < points.length; i += 3)
				{
					geometry2.vertices.push(new THREE.Vector3(points[i + 0], points[i + 1], points[i + 2]));
				}

				// const polys = message.data.polys;
				// const polys = new Uint32Array(geometry.index.array);

				// for (let i = 0; i < polys.length; i += 3)
				for (let i = 0; i < polys.length; i += 3)
				{
					// cc_tri.push([ polys[i + 1], polys[i + 2], polys[i + 3] ]);
					geometry2.faces.push({ a: polys[i + 0], b: polys[i + 1], c: polys[i + 2] });
				}

				const _smooth = modifier.modify(geometry2);

				LOG(geometry2)

				const ppp = [];
				for (let i = 0; i < geometry2.vertices.length; ++i)
				{
					ppp.push(geometry2.vertices[i].x, geometry2.vertices[i].y, geometry2.vertices[i].z);
				}

				const ttt = [];
				for (let i = 0; i < geometry2.faces.length; ++i)
				{
					ttt.push(geometry2.faces[i].a, geometry2.faces[i].b, geometry2.faces[i].c);
				}



				// const ppp = [];
				// for (let i = 0; i < smooth.positions.length; ++i)
				// {
				// 	ppp.push(smooth.positions[i][0], smooth.positions[i][1], smooth.positions[i][2]);
				// }

				// const ttt = [];
				// for (let i = 0; i < smooth.cells.length; ++i)
				// {
				// 	ttt.push(smooth.cells[i][0], smooth.cells[i][1], smooth.cells[i][2]);
				// }

				// LOG(message.data.points, message.data.polys)
				// LOG(new Float32Array(ppp), new Uint32Array(ttt))

				window.__renderMesh__(new Float32Array(ppp), new Uint32Array(ttt));
				// window.__renderMesh__(points, polys);
			};

			window.doMarchingCubes = () =>
			{
				LOG('doMarchingCubes')
				LOG({ spacing: data.getSpacing(), extent: data.getExtent(), data: painter.getOutputData().get().pointData.get().arrays[0].data.getData() })
				marching_cubes_worker.postMessage({ spacing: data.getSpacing(), extent: data.getExtent(), data: painter.getOutputData().get().pointData.get().arrays[0].data.getData() });
			};

			// paint_handle.onEndInteractionEvent
			// (
			// 	() =>
			// 	{
			// 		// paint_handle.onInteractionEvent(() => 0);
			// 		// LOG(painter)
			// 		// painter.endStroke();

			// 		// marching_cubes_worker.postMessage({ spacing: data.getSpacing(), extent: data.getExtent(), data: painter.getOutputData().get().pointData.get().arrays[0].data.getData() });
			// 	},
			// );



			setCamera(index, renderer, data, paint_handle);

			// renderer.resetCameraClippingRange();
			render_window.render();



			gui_folder_slices
				.add(gui_options, view, data_extent[index * 2 + 0], data_extent[index * 2 + 1], 1)
				.onChange
				(
					(value) =>
					{
						image_mapper.setSlice(value);
						segment_mapper.setSlice(value);

						const ijk = [ 0, 0, 0 ];
						const position = [ 0, 0, 0 ];

						ijk[index] = image_mapper.getSlice();

						data.indexToWorld(ijk, position);

						paint_handle.get().manipulator.setOrigin(position);

						paint_handle.updateRepresentationForRender();

						render_window.render();
					},
				);
		},
	);

	gui_folder_settings
		.add(gui_options, 'color window', data_range[0], data_range[1], 1)
		.onChange
		(
			(value) =>
			{
				image_actors.forEach((_) => _.getProperty().setColorWindow(value));

				render_windows.forEach((_) => _.render());
			},
		);

	gui_folder_settings
		.add(gui_options, 'color level', data_range[0], data_range[1], 1)
		.onChange
		(
			(value) =>
			{
				image_actors.forEach((_) => _.getProperty().setColorLevel(value));

				render_windows.forEach((_) => _.render());
			},
		);

	gui_folder_settings
		.add(gui_options, 'scale', 1, 200, 1)
		.onChange
		(
			(value) =>
			{
				cameras.forEach((_) => _.setParallelScale(value));

				// render_windows.forEach((_) => _.render());
			},
		);



	{
		const glkit = new WebGL
		({
			dataArrayConstructor: Float32Array,
			// antialias: true,

			extensions:
			[
				'OES_standard_derivatives',
				'OES_element_index_uint',
				'OES_texture_float',
				// 'WEBGL_color_buffer_float',
			],
		});

		document.querySelector('#sculpt').appendChild(glkit.canvas);

		glkit.setSize(0, 0, document.querySelector('#sculpt').offsetWidth, document.querySelector('#sculpt').offsetHeight);



		const gl = glkit.webgl_rendering_context;

		gl.clearColor(0, 0, 0, 1);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.depthFunc(gl.LEQUAL);



		const glkit_time = new glkit.Time();



		const orbit =
			new glkit.Orbit
			({
				mouseTarget: glkit.canvas,
				mousedownTarget: glkit.canvas,
				time: glkit_time,
			});

		const orbit_zoom = new glkit.Vec1().set(10);

		orbit.camera
			.setPerspectiveProjection
			(
				10,
				window.innerWidth / window.innerHeight,
				1,
				2000,
				orbit_zoom.value,
			);

		orbit.obj.translation.set(0, 0, 700);

		orbit.needsUpdate = true;

		orbit.bindMouseEvents(1, 1);

		glkit.canvas.addEventListener
		(
			'wheel',

			(evt) =>
			{
				const sign = Math.sign(evt.deltaY || evt.detail || evt.wheelDelta);

				orbit_zoom
					.mulS(Math.pow(1.1, -sign))
					.trim(0.1, 20);

				orbit.camera
					.setPerspectiveProjection
					(
						10,
						window.innerWidth / window.innerHeight,
						1,
						2000,
						orbit_zoom.value,
					);

				orbit.needsUpdate = true;

				glkit.$();
			},
		);



		glkit_time.updateCustoms = () =>
		{
			if (orbit.needsUpdate)
			{
				orbit.needsUpdate = false;

				orbit.update().$2();
			}
		};



		const program =
			new glkit.Program
			({
				VS: () =>
					`${ glkit.Shader.maxPrecision.vs.int }
					${ glkit.Shader.maxPrecision.vs.float }

					${ glkit.VertexAttrib.inject('in_index', 0, 'float') }
					${ glkit.VertexAttrib.inject('in_offset', 1, 'float') }
					${ glkit.VertexAttrib.inject('in_length', 2, 'float') }

					${ orbit.camera.projection_view_matrix.inject('u_projection_view_matrix') }
					${ orbit.obj.matrix.inject2('vec3', 'u_camera_position', (l, d) => gl.uniform3f(l, d[12], d[13], d[14])) }
					uniform sampler2D u_vertices;
					uniform sampler2D u_triangles;
					uniform int u_mode;

					varying vec3 v_position;
					varying vec3 v_light_direction;
					varying vec3 v_normal;

					#define RAYCAST_MODE_OFF u_raycast_mode == 0
					uniform int u_raycast_mode;
					uniform mat4 u_raycast_projection_matrix;
					uniform mat4 u_raycast_view_matrix;
					varying vec4 v_raycast_output;

					#define GET_TEXEL_COORDS(coords, index, size)\
						vec2 coords;\
						coords.y = (index) / (size);\
						coords.x = fract(coords.y);\
						coords.y = floor(coords.y - coords.x) / (size);

					void main ()
					{
						GET_TEXEL_COORDS(_texel_coord, in_index, 2048.0);

						vec3 in_position_tex = texture2D(u_vertices, _texel_coord).rgb;

						if (RAYCAST_MODE_OFF)
						{
							if (u_mode == 0)
							{
								gl_Position = u_projection_view_matrix * vec4(in_position_tex, 1.0);

								v_normal = vec3(0);

								int length = int(in_length);

								// In many cases 1 iteration wiil be sufficient.
								// On smooth surfaces with a big count of triangles
								// each triangle related to vertex
								// has a normal approximated to normals of other
								// triangles. So normal calculated on just single
								// triangle will give good result.

								for (int ii = 0; ii < 2048; ++ii)
								{
									if (ii >= length)
									{
										break;
									}

									GET_TEXEL_COORDS(TC, in_offset + float(ii), 2048.0);

									vec2 ai = texture2D(u_triangles, TC).rg;

									vec3 a = in_position_tex;

									GET_TEXEL_COORDS(_TC1, ai.r, 2048.0);

									vec3 b = texture2D(u_vertices, _TC1).rgb;

									GET_TEXEL_COORDS(_TC2, ai.g, 2048.0);

									vec3 c = texture2D(u_vertices, _TC2).rgb;

									v_normal += cross(a - b, a - c);
								}

								v_normal = normalize(v_normal);
							}
							else
							{
								gl_PointSize = 1.0;

								gl_Position = vec4(((_texel_coord + (0.5 / 2048.0)) * 2.0) - 1.0, 0, 1.0);
							}

							v_position = in_position_tex;
							v_light_direction = normalize(u_camera_position - v_position);
						}
						else
						{
							vec4 view_position = u_raycast_view_matrix * vec4(in_position_tex, 1.0);

							gl_Position = u_raycast_projection_matrix * view_position;

							v_raycast_output.r = -view_position.z;
						}
					}`,

				FS: () =>
					`#extension GL_OES_standard_derivatives: enable

					${ glkit.Shader.maxPrecision.fs.int }
					${ glkit.Shader.maxPrecision.fs.float }

					uniform int u_mode;
					uniform vec3 u_distance;
					uniform float u_radius;
					uniform float u_strength;
					uniform int u_shading_mode;
					uniform int u_mouse_moved;
					uniform float u_inverted;

					varying vec3 v_position;
					varying vec3 v_light_direction;
					varying vec3 v_normal;

					#define RAYCAST_MODE_OFF u_raycast_mode == 0
					uniform int u_raycast_mode;
					varying vec4 v_raycast_output;

					void main ()
					{
						if (RAYCAST_MODE_OFF)
						{
							if (u_mode == 0)
							{
								float diffuse;

								if (u_shading_mode == 0)
								{
									diffuse =
										dot(normalize(cross(dFdx(v_position), dFdy(v_position))), v_light_direction);
								}
								else
								{
									diffuse =	dot(v_normal, v_light_direction);
								}

								gl_FragColor.rgb = vec3(1.0) * diffuse;

								gl_FragColor.a = 1.0;
							}
							else
							{
								gl_FragColor.rgb = v_position;

								if (u_mouse_moved == 2)
								{
									if (distance(v_position, u_distance) < u_radius)
									{
										gl_FragColor.rgb -=
											u_inverted * v_light_direction * (cos((distance(v_position, u_distance) / u_radius) * ${ Math.PI }) + 1.0) * u_strength;
									}
								}
							}
						}
						else
						{
							gl_FragColor = v_raycast_output;
						}
					}`,
			});



		let vertex_count = 0;
		let new_indices = null;

		const vertex_buffer = gl.createBuffer();
		const index_buffer = gl.createBuffer();

		gl.activeTexture(gl.TEXTURE1);

		const tri_texture =
			new glkit.Texture2D()
				.bind()
				.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
				.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		gl.activeTexture(gl.TEXTURE0);

		const texture =
			new glkit.Texture2D()
				.bind()
				.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
				.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		const texture2 =
			new glkit.Texture2D()
				.bind()
				.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
				.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		const textures = [ texture, texture2 ];

		const framebuffer =
			new glkit.Framebuffer()
				.bind()
				.texture2D(gl.COLOR_ATTACHMENT0, texture)
				.unbind();

		const framebuffer2 =
			new glkit.Framebuffer()
				.bind()
				.texture2D(gl.COLOR_ATTACHMENT0, texture2)
				.unbind();

		const framebuffers = [ framebuffer, framebuffer2 ];

		// TODO: rename
		window.__renderMesh__ = (vertices, indices) =>
		{
			const vert_keys = {};
			const vert_arr2 = [];
			// const tri = [];

			const new_pos__ = [];

			const p = vertices;

			let yy = 0;

			for (let i = 0; i < p.length; i += 3)
			{
				const x = p[i + 0];
				const y = p[i + 1];
				const z = p[i + 2];

				const key = `${ x.toFixed(6) }_${ y.toFixed(6) }_${ z.toFixed(6) }`;

				if (!vert_keys[key])
				{
					vert_keys[key] = { vert_index: yy++, vert_indices: [] };

					new_pos__.push(x, y, z);
				}

				vert_keys[key].vert_indices.push(i / 3);

				vert_arr2[i / 3] = vert_keys[key].vert_index;
			}

			LOG(indices)

			const new_indices__ = indices.map((elm) => vert_arr2[elm]);



			// const cc_points = [];
			// const cc_tri = [];

			// for (let i = 0; i < new_pos__.length; i += 3)
			// {
			// 	cc_points.push([ new_pos__[i + 0], new_pos__[i + 1], new_pos__[i + 2] ]);
			// }

			// for (let i = 0; i < new_indices__.length; i += 3)
			// {
			// 	cc_tri.push([ new_indices__[i + 0], new_indices__[i + 1], new_indices__[i + 2] ]);
			// }



			// const smooth = catmullClark(cc_points, cc_tri, 1, true);

			// LOG('smooth', smooth)

			// const ppp = [];
			// for (let i = 0; i < smooth.positions.length; ++i)
			// {
			// 	ppp.push(smooth.positions[i][0], smooth.positions[i][1], smooth.positions[i][2]);
			// }

			// const ttt = [];
			// for (let i = 0; i < smooth.cells.length; ++i)
			// {
			// 	ttt.push(smooth.cells[i][0], smooth.cells[i][1], smooth.cells[i][2]);
			// }

			// LOG('ppp ttt', ppp, ttt)



			// for (let i = 0; i < new_indices.length; ++i)
			// {
			// 	if (!tri[new_indices[i]])
			// 	{
			// 		tri[new_indices[i]] = [];
			// 	}

			// 	tri[new_indices[i]].push(Math.floor(i / 3));
			// }

			// tri.forEach
			// (
			// 	(elm, _index, _tri) =>
			// 	{
			// 		elm.offset = _tri.slice(0, _index).reduce((acc, val) => (acc + val.length), 0);
			// 	},
			// );

			// LOG(new_indices)

			// const new_pos = new_pos__;
			const new_pos = vertices;
			// new_indices = new_indices__;
			new_indices = indices;
			const tri = [];

			LOG('JJJ', new_pos, new_pos__, indices, new_indices__)

			for (let i = 0; i < new_indices.length; ++i)
			{
				if (!tri[new_indices[i]])
				{
					tri[new_indices[i]] = [];
				}

				tri[new_indices[i]].push(Math.floor(i / 3));
				// LOG(i / 3, Math.floor(i / 3))
				// tri[new_indices[i]].push(i / 3);
			}

			LOG(tri)

			// for (let vertex_index = 0; vertex_index < new_indices.length; vertex_index += 3)
			// {
			// 	const a = vertex_index + 0;
			// 	const b = vertex_index + 1;
			// 	const c = vertex_index + 3;

			// 	if (!tri[new_indices[a]])
			// 	{
			// 		tri[new_indices[a]] = [];
			// 	}

			// 	tri[new_indices[i]].push(i);

			// 	if (!tri[new_indices[i]])
			// 	{
			// 		tri[new_indices[i]] = [];
			// 	}

			// 	tri[new_indices[i]].push(i);

			// 	if (!tri[new_indices[i]])
			// 	{
			// 		tri[new_indices[i]] = [];
			// 	}

			// 	tri[new_indices[i]].push(i);
			// }

			let _offset = 0;

			tri.forEach
			(
				(elm) =>
				{
					elm.offset = _offset;

					_offset += elm.length;
				},
			);

			vertex_count = new_pos.length / 3;
			const vertex_data = new Float32Array(2048 * 2048 * 4);
			let vertex_data2 = [];
			const triangle_data = [];

			for (let i = 0; i < vertex_count; ++i)
			{
				vertex_data[(i * 4) + 0] = new_pos[(i * 3) + 0];
				vertex_data[(i * 4) + 1] = new_pos[(i * 3) + 1];
				vertex_data[(i * 4) + 2] = new_pos[(i * 3) + 2];

				vertex_data2.push(i, tri[i].offset, tri[i].length);

				tri[i].forEach
				(
					(elm) =>
					{
						const a = new_indices[(elm * 3) + 0];
						const b = new_indices[(elm * 3) + 1];
						const c = new_indices[(elm * 3) + 2];

						if (i === a)
						{
							triangle_data.push(b, c, 0, 0);
						}
						else if (i === b)
						{
							triangle_data.push(c, a, 0, 0);
						}
						else
						{
							triangle_data.push(a, b, 0, 0);
						}
					},
				);
			}

			LOG(new_indices)

			vertex_data2 = new Float32Array(vertex_data2);
			const triangle_data2 = new Float32Array(2048 * 2048 * 4);
			triangle_data2.set(triangle_data);

			gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, vertex_count * 4 * 3, gl.STATIC_DRAW);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertex_data2);
			gl.vertexAttribPointer(0, 1, gl.FLOAT, 0, 12, 0);
			gl.vertexAttribPointer(1, 1, gl.FLOAT, 0, 12, 4);
			gl.vertexAttribPointer(2, 1, gl.FLOAT, 0, 12, 8);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(new_indices), gl.STATIC_DRAW);

			gl.enableVertexAttribArray(0);
			gl.enableVertexAttribArray(1);
			gl.enableVertexAttribArray(2);



			gl.activeTexture(gl.TEXTURE1);

			tri_texture
				.bind()
				.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
				.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
				.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, triangle_data2);

			gl.activeTexture(gl.TEXTURE0);

			texture
				.bind()
				.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
				.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
				.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, vertex_data);

			texture2
				.bind()
				.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
				.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
				.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, vertex_data);

			framebuffer
				.bind()
				.texture2D(gl.COLOR_ATTACHMENT0, texture)
				.unbind();

			framebuffer2
				.bind()
				.texture2D(gl.COLOR_ATTACHMENT0, texture2)
				.unbind();
		};

		// const geometry = new THREE.BoxGeometry(10, 10, 10, 10, 10, 10);
		// const geometry = new THREE.BoxGeometry(10, 10, 10, 300, 300, 300);
		// const geometry = new THREE.TorusKnotGeometry(10, 3, 300, 100);
		// LOG(geometry)

		// __renderMesh__(geometry.attributes.position.array, geometry.index.array);



		let mouse_moved = false;

		const raycaster = new glkit.Raycaster();
		const point = new glkit.Vec3();
		const direction = new glkit.Vec3();

		const u_raycast_mode = program.getUniformLocation('u_raycast_mode');
		const u_raycast_projection_matrix = program.getUniformLocation('u_raycast_projection_matrix');
		const u_raycast_view_matrix = program.getUniformLocation('u_raycast_view_matrix');
		const u_distance = program.getUniformLocation('u_distance');
		const u_mode = program.getUniformLocation('u_mode');
		const u_vertices = program.getUniformLocation('u_vertices');
		const u_triangles = program.getUniformLocation('u_triangles');
		const u_shading_mode = program.getUniformLocation('u_shading_mode');
		const u_radius = program.getUniformLocation('u_radius');
		const u_strength = program.getUniformLocation('u_strength');
		const u_mouse_moved = program.getUniformLocation('u_mouse_moved');
		const u_inverted = program.getUniformLocation('u_inverted');

		gl.useProgram(program.handle);

		gl.uniform1i(u_shading_mode, 1);
		gl.uniform1f(u_radius, 3);
		gl.uniform1f(u_strength, 0.05);
		gl.uniform1f(u_inverted, -1);
		gl.uniform1i(u_vertices, 0);
		gl.uniform1i(u_triangles, 1);

		gl.uniformMatrix4fv
		(
			u_raycast_projection_matrix,
			false,
			raycaster.camera.projectionMatrix.arr,
		);

		// gl.activeTexture(gl.TEXTURE1);

		// const tri_texture =
		// 	new glkit.Texture2D()
		// 		.bind()
		// 		.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		// 		.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		// 		.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, triangle_data2);

		// gl.activeTexture(gl.TEXTURE0);

		// const texture =
		// 	new glkit.Texture2D()
		// 		.bind()
		// 		.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		// 		.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		// 		.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, vertex_data);

		// const texture2 =
		// 	new glkit.Texture2D()
		// 		.bind()
		// 		.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		// 		.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		// 		.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, vertex_data);

		// const textures = [ texture, texture2 ];

		// const framebuffer =
		// 	new glkit.Framebuffer()
		// 		.bind()
		// 		.texture2D(gl.COLOR_ATTACHMENT0, texture)
		// 		.unbind();

		// const framebuffer2 =
		// 	new glkit.Framebuffer()
		// 		.bind()
		// 		.texture2D(gl.COLOR_ATTACHMENT0, texture2)
		// 		.unbind();

		// const framebuffers = [ framebuffer, framebuffer2 ];

		let curr_tex = 0;

		const snap = () =>
		{
			gl.uniform1i(u_raycast_mode, 1);

			gl.uniformMatrix4fv
			(
				u_raycast_view_matrix,
				false,
				raycaster.camera.viewMatrix.arr,
			);

			// gl.drawArrays(gl.TRIANGLES, 0, vertex_count);
			gl.drawElements(gl.TRIANGLES, new_indices.length, gl.UNSIGNED_INT, 0);
			gl.uniform1i(u_raycast_mode, 0);
		};

		// let clientX = 0;
		// let clientY = 0;
		let layerX = 0;
		let layerY = 0;

		glkit.canvas.addEventListener
		(
			'mousemove',

			(evt) =>
			{
				if (evt.ctrlKey || evt.metaKey)
				{
					// LOG(window);
					// ({ clientX, clientY } = evt);
					// ({ layerX, layerY } = evt);

					var rect = evt.target.getBoundingClientRect();

					LOG(evt.clientX - rect.left)

					layerX = evt.clientX - rect.left;
					layerY = evt.clientY - rect.top;

					mouse_moved = 2;
				}
			},
		);

		glkit.canvas.addEventListener
		(
			'dblclick',

			(evt) =>
			{
				// ({ clientX, clientY } = evt);
				({ layerX, layerY } = evt);

				mouse_moved = 2;
			},
		);



		glkit_time.loop6
		(
			() =>
			{
				program.updateUniformStackUniforms();

				if (mouse_moved)
				{
					gl.uniform1i(u_mouse_moved, mouse_moved);



					// const mouse_x = ((clientX / window.innerWidth) - 0.5) * 2;
					// const mouse_y = -((clientY / window.innerHeight) - 0.5) * 2;
					const mouse_x = ((layerX / glkit.canvas.clientWidth) - 0.5) * 2;
					const mouse_y = -((layerY / glkit.canvas.clientHeight) - 0.5) * 2;

					// LOG(mouse_x, mouse_y)

					point.extractTranslation(orbit.obj.matrix);

					direction.directToScreenCoords2(mouse_x, mouse_y, orbit.camera);

					raycaster.cameraObj
						.setBackDirectionZ(direction)
						.setTranslation(point, 1)
						.update();

					raycaster.camera.viewMatrix
						.copy(raycaster.cameraObj.matrix)
						.inverse();

					raycaster.framebuffer.bind();

					gl.viewport(0, 0, 1, 1);



					raycaster.snap(snap);

					gl.uniform3fv(u_distance, direction.mulS(raycaster.pixel[0]).add(point).arr);



					// raycaster.framebuffer.unbind();



					// glkit.viewport(0, 0, glkit.canvas.clientWidth, glkit.canvas.clientHeight);



					gl.uniform1i(u_mode, 1);

					// gl.activeTexture(gl.TEXTURE0);
					textures[curr_tex].bind();
					framebuffers[curr_tex = 1 - curr_tex].bind();

					gl.viewport(0, 0, 2048, 2048);
					gl.drawArrays(gl.POINTS, 0, vertex_count);

					gl.bindFramebuffer(gl.FRAMEBUFFER, null);



					glkit.viewport(0, 0, glkit.canvas.clientWidth, glkit.canvas.clientHeight);

					gl.uniform1i(u_mode, 0);



					--mouse_moved;
				}

				gl.uniform1i(u_mode, 0);

				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

				// gl.drawArrays(gl.TRIANGLES, 0, vertex_count);
				new_indices && gl.drawElements(gl.TRIANGLES, new_indices.length, gl.UNSIGNED_INT, 0);
			},
		);

		// const gui = new dat.GUI();

		// const gui_options =
		// {
		// 	'shading mode': 1,
		// 	radius: 3,
		// 	strength: 0.05,
		// 	inverted: false,
		// };

		// gui
		// 	.add(gui_options, 'shading mode', { flat: 0, smooth: 1 })
		// 	.onChange
		// 	(
		// 		(evt) =>
		// 		{
		// 			gl.uniform1i(u_shading_mode, evt);

		// 			glkit.$();
		// 		},
		// 	);

		// gui
		// 	.add(gui_options, 'radius', 0.1, 5)
		// 	.onChange
		// 	(
		// 		(evt) =>
		// 		{
		// 			gl.uniform1f(u_radius, evt);

		// 			glkit.$();
		// 		},
		// 	);

		// gui
		// 	.add(gui_options, 'strength', 0.01, 0.1)
		// 	.onChange
		// 	(
		// 		(evt) =>
		// 		{
		// 			gl.uniform1f(u_strength, evt);

		// 			glkit.$();
		// 		},
		// 	);

		// gui
		// 	.add(gui_options, 'inverted')
		// 	.onChange
		// 	(
		// 		(evt) =>
		// 		{
		// 			gl.uniform1f(u_inverted, Math.round((Number(evt) - 0.5) * 2));

		// 			glkit.$();
		// 		},
		// 	);
	}
};



// window.addEventListener
// (
// 	'load',

// 	async () =>
// 	{
// 		// // const file = await fetch('assets/0002.DCM').then((_) => _.blob()).then((_) => new File([ _ ], 'data', { type: 'image\dicom' }));
// 		// const file = await fetch('assets/avg152T1_LR_nifti.nii.gz').then((_) => _.blob()).then((_) => new File([ _ ], 'data', { type: 'application/dicom; image/nii' }));

// 		// const input = document.querySelector('#data-input');

// 		// input.addEventListener
// 		// (
// 		// 	'change',

// 		// 	async (evt) =>
// 		// 	{
// 		// 		const { image } = await window.itk.readImageFile(null, evt.target.files[0]);

// 		// 		const itk_image = image;

// 		// 		const vtk_image = ITKHelper.convertItkToVtkImage(itk_image);

// 		// 		presentImage(vtk_image);
// 		// 	},
// 		// );
// 	},
// );



// const reader = xmlImageDataReader.newInstance({ fetchGzip: true });

// reader
// 	.setUrl('assets/head-binary.vti', { loadData: true })
// 	// .setUrl('assets/d0aa_orig.nii.gz', { loadData: true })
// 	.then
// 	(
// 		() =>
// 		{
// 			const data = reader.getOutputData();

// 			presentImage(data);
// 		},
// 	);
