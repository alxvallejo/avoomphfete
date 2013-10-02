jQuery(document).ready(function($){
	
	$('.oomph-crop-thumbnail').on( 'click', function() {

		/* Pass data object to onComplete function */
		var data = {}

		data.thumb_src = $(this).attr('src');
		data.post_id = $(this).data('post_id');
		data.thumb_id = $(this).data('thumb_id');

		$(this).colorbox({onComplete:init(data)});
	})

	function init(data) {
		console.log(data);
		
	}
})