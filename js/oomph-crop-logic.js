jQuery(document).ready(function($){
	
	$('img.oomph-crop-thumbnail').on( 'click', function() {

		/* Pass data object to onComplete function */
		var data = {}

		data.thumb_src = $(this).attr('src');
		data.post_id = $(this).data('post_id');
		data.thumb_id = $(this).data('thumb_id');
		data.width = $(this).width();
		data.height = $(this).height();

		$(this).colorbox({onComplete:init(data)});
	})

	function init(data) {
		console.log(data);

		get_image = {
			action: 'jscropwow_find_img',
			nonce: 'jscropwow_vars.nonce',
			post_id: data.post_id,
			thumb_src: data.thumb_src, // may not need this since we're interpretting the intermediate size
			thumb_id: data.thumb_id,
			thumb_width: data.width,
			thumb_height: data.height
		}

		$.ajax({
			type: "GET",
			url: jscropwow_vars.ajaxurl,
			data: get_image,
			datatype: "json"
		}).done(function(response){
			var parse = $.parseJSON(response);

			var fimg = parse['thumbnail'];
			console.log(fimg);
			
		})

		/* cbox destination, id="cboxLoadedContent" */
		
	}
})