/*
eslint-disable

no-bitwise,
*/



import './index.scss';

import { WebGL } from '../../../../3d-smile-glkit/src/index';
import * as THREE from 'three';

import * as dat from 'dat.gui';

// LOG(dat)



document.body.innerHTML = '<canvas></canvas>';



// const geometry = new THREE.BoxGeometry(10, 10, 10, 10, 10, 10);
const geometry = new THREE.BoxGeometry(10, 10, 10, 300, 300, 300);
// const geometry = new THREE.TorusKnotGeometry(10, 3, 300, 100);
LOG(geometry)

// const vert_keys = {};
// const vert_arr2 = [];
// const tri = [];

// const new_pos = [];

// const p = geometry.attributes.position.array;

// let yy = 0;

// for (let i = 0; i < p.length; i += 3)
// {
// 	const x = p[i + 0];
// 	const y = p[i + 1];
// 	const z = p[i + 2];

// 	const key = `${ x.toFixed(6) }_${ y.toFixed(6) }_${ z.toFixed(6) }`;

// 	if (!vert_keys[key])
// 	{
// 		vert_keys[key] = { vert_index: yy++, vert_indices: [] };

// 		new_pos.push(x, y, z);
// 	}

// 	vert_keys[key].vert_indices.push(i / 3);

// 	vert_arr2[i / 3] = vert_keys[key].vert_index;
// }

// const new_indices = geometry.index.array.map((elm) => vert_arr2[elm]);

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

const new_pos = geometry.attributes.position.array;
const new_indices = geometry.index.array;
const tri = [];

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

const glkit = new WebGL
({
	canvas: document.getElementsByTagName('canvas')[0],
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

glkit.setSize(0, 0, window.innerWidth, window.innerHeight);



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



const vertex_count = new_pos.length / 3;
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

vertex_data2 = new Float32Array(vertex_data2);
const triangle_data2 = new Float32Array(2048 * 2048 * 4);
triangle_data2.set(triangle_data);

gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER, vertex_count * 4 * 3, gl.STATIC_DRAW);
gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertex_data2);
gl.vertexAttribPointer(0, 1, gl.FLOAT, 0, 12, 0);
gl.vertexAttribPointer(1, 1, gl.FLOAT, 0, 12, 4);
gl.vertexAttribPointer(2, 1, gl.FLOAT, 0, 12, 8);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(new_indices), gl.STATIC_DRAW);

gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.enableVertexAttribArray(2);



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

gl.activeTexture(gl.TEXTURE1);

new glkit.Texture2D()
	.bind()
	.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
	.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
	.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, triangle_data2);

gl.activeTexture(gl.TEXTURE0);

const texture =
	new glkit.Texture2D()
		.bind()
		.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, vertex_data);

const texture2 =
	new glkit.Texture2D()
		.bind()
		.parameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		.parameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		.image2D2(0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.FLOAT, vertex_data);

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

let clientX = 0;
let clientY = 0;

glkit.canvas.addEventListener
(
	'mousemove',

	(evt) =>
	{
		if (evt.ctrlKey)
		{
			({ clientX, clientY } = evt);

			mouse_moved = 2;
		}
	},
);

glkit.canvas.addEventListener
(
	'dblclick',

	(evt) =>
	{
		({ clientX, clientY } = evt);

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



			const mouse_x = ((clientX / window.innerWidth) - 0.5) * 2;
			const mouse_y = -((clientY / window.innerHeight) - 0.5) * 2;

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



			raycaster.framebuffer.unbind();



			glkit.viewport(0, 0, window.innerWidth, window.innerHeight);



			gl.uniform1i(u_mode, 1);

			// gl.activeTexture(gl.TEXTURE0);
			textures[curr_tex].bind();
			framebuffers[curr_tex = 1 - curr_tex].bind();

			gl.viewport(0, 0, 2048, 2048);
			gl.drawArrays(gl.POINTS, 0, vertex_count);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);



			glkit.viewport(0, 0, window.innerWidth, window.innerHeight);

			gl.uniform1i(u_mode, 0);



			--mouse_moved;
		}

		gl.uniform1i(u_mode, 0);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		// gl.drawArrays(gl.TRIANGLES, 0, vertex_count);
		gl.drawElements(gl.TRIANGLES, new_indices.length, gl.UNSIGNED_INT, 0);
	},
);

const gui = new dat.GUI();

const gui_options =
{
	'shading mode': 1,
	radius: 3,
	strength: 0.05,
	inverted: false,
};

gui
	.add(gui_options, 'shading mode', { flat: 0, smooth: 1 })
	.onChange
	(
		(evt) =>
		{
			gl.uniform1i(u_shading_mode, evt);

			glkit.$();
		},
	);

gui
	.add(gui_options, 'radius', 0.1, 5)
	.onChange
	(
		(evt) =>
		{
			gl.uniform1f(u_radius, evt);

			glkit.$();
		},
	);

gui
	.add(gui_options, 'strength', 0.01, 0.1)
	.onChange
	(
		(evt) =>
		{
			gl.uniform1f(u_strength, evt);

			glkit.$();
		},
	);

gui
	.add(gui_options, 'inverted')
	.onChange
	(
		(evt) =>
		{
			gl.uniform1f(u_inverted, Math.round((Number(evt) - 0.5) * 2));

			glkit.$();
		},
	);
