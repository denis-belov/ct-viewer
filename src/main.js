const path = require('path');
const child_process = require('child_process');
const readline = require('readline');
const chokidar = require('chokidar');

const
	{
		app,
		BrowserWindow,
		// globalShortcut,
	} = require('electron');



const PATH_ADDONS_NODE_API_TEST_SRC = path.join(__dirname, 'addons/test-cpp/src');



let window = null;



const createWindow = () =>
{
	window = new BrowserWindow
	(
		{
			width: 800,
			height: 600,

			webPreferences:
			{
				preload: path.join(__dirname, 'preload.js'),

				// Unify nodejs and chromium memory spaces.
				contextIsolation: false,
			},
		},
	);

	// window.setFullScreen(true);

	if (process.env.__ELECTRON_LOCAL__)
	{
		window.toggleDevTools();

		window.loadURL('http://localhost:8080');
	}
	else
	{
		window.loadFile(path.join(__dirname, 'frontend/build/index.html'));
	}
};

if (process.env.__ELECTRON_LOCAL__)
{
	if (process.platform === 'win32')
	{
		const rl =
			readline
				.createInterface
				(
					{
						input: process.stdin,
						output: process.stdout
					},
				);

		rl.on
		(
			'SIGINT',

			() =>
			{
				process.emit('SIGINT');
			},
		);
	}

	const killNode = () =>
	{
		console.log('KILL NODE');
		// Killing all node processes on linux and windows
		// Find a better cross-OS way to kill frontend process ?
		switch (process.platform)
		{
		case 'linux':

			child_process.execSync('killall -9 node');

			break;

		case 'win32':

			child_process.execSync('taskkill /F /IM node.exe /T');

			break;

		default:
		}
	};

	app
		.whenReady()
		.then
		(
			() =>
			{
				console.log('test-cpp BUILD STDOUT:');
				console.log
				(
					child_process
						.execSync
						(`cd ${ __dirname } && npm run build:addon:test-cpp`, { encoding: 'utf8' }),
				);

				const frontend_process =
					child_process
						.spawn
						(`cd ${ __dirname } && npm run start:frontend`, { shell: true });

				process.on('exit', killNode);

				if (process.platform === 'win32')
				{
					process.on('SIGINT', killNode);
				}

				frontend_process.stdout.on
				(
					'data',

					(_data) =>
					{
						console.log('FRONTEND PROCESS STDOUT:');
						console.log(`${ _data }`);

						window.reload();
					},
				);

				createWindow();

				if (process.platform === 'linux')
				{
					// Watch non-frontend modules.
					// Frontend is watched by webpack.
					chokidar
						.watch
						(
							[
								PATH_ADDONS_NODE_API_TEST_SRC,
							],
						)
						.on
						(
							'change',

							(evt) =>
							{
								if (evt.includes(PATH_ADDONS_NODE_API_TEST_SRC))
								{
									console.log('test-cpp BUILD STDOUT:');
									console.log
									(
										child_process
											.execSync
											(`cd ${ __dirname } && npm run build:addon:test-cpp`, { encoding: 'utf8' }),
									);

									window.close();

									createWindow();
								}
							},
						);
				}
			},
		);
}
else
{
	app
		.whenReady()
		.then(createWindow);
}
