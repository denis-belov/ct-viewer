
/*
eslint-disable

no-multi-spaces,
*/



import * as actions from './actions';



const reducer =
(
	state =
	{
		segmentation: false,
		only_3d: true,
	},

	action,
) =>
{
	switch (action.type)
	{
	case actions.TOGGLE_SEGMENTATION:         return { ...state, segmentation: !state.segmentation };

	default: return { ...state };

	}
};

export { reducer };
