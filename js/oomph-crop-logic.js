jQuery(document).ready(function($){

	/* If it's data, you know you're going to be passing it somewhere */
	
	$('img.oomph-crop-thumbnail').on( 'click', function() {

		/* Pass data object to onComplete function */
		var data = {}

		data.thumb_src = $(this).attr('src');
		data.post_id = $(this).data('post_id');
		data.thumb_id = $(this).data('thumb_id');
		data.width = $(this).width();
		data.height = $(this).height();

		$(this).colorbox({onLoad:init(data)});
	});

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

			/* Pass data object to onComplete function */
			var data = {}

			var parse = $.parseJSON(response);

			data.large_thumb_html = parse['large_thumb_html'];
			data.is_original = parse['is_original'];
			data.target_filename = parse['target_filename'];
			data.nonce = parse['nonce'];
			cbox_html = parse['cbox_html'];
			console.log(data.large_thumb_html);

			/* cbox destination, id="cboxLoadedContent" */
			$('#cboxLoadedContent').html(cbox_html);
			jcrop(data);
		})		
	}

	function jcrop(data) {
		console.log(data);

		var orig_w = $(data.large_thumb_html).attr('width');
		var orig_h = $(data.large_thumb_html).attr('height');
		console.log('Original dims: ' + orig_w + ' x ' + orig_h);

		var leftcol = $('#oomph_crop #leftcol');
        var rightcol = $('#oomph_crop #rightcol');
        var jcrop_holder = $('#oomph_crop #jcrop-holder');
        var jcrop_target = $('#oomph_crop #jcrop_target');
        var preview_container = $('#preview-pane .preview-container');
        var preview_pane = $('#preview-pane'); // parent div for preview container
		$(jcrop_target).empty();
		$(preview_container).empty();
		$('.loading').hide();

		$(jcrop_target).html(data.large_thumb_html);
		$('img', jcrop_target).attr('id', 'target');
		$(preview_container).html(data.large_thumb_html);

		var preview_img = $('img', preview_container);
    	$(preview_img).attr('class', 'jcrop_preview');

    	// logic for initial crop area is determined by preview container
		$(preview_container).width(data.width);
		$(preview_container).height(data.height);

        // Set the absolute positioning of the preview pane
        // JCrop uses absolute positioning natively.
        var target_height = $(preview_container).height();
        console.log( 'TARGET HEIGHT ' + target_height );
        $(preview_pane).css({'position': 'absolute', 'top':target_height+20});

		var jcrop_api,
			boundx,
			boundy,

			// Grab some preview information from the preview pane
			$preview = $('#preview-pane'),
			$pimg = $('#preview-pane .preview-container img'),

			xsize = $(preview_container).width(),
			ysize = $(preview_container).height();

		console.log('init', [xsize, ysize]);

		$(target).Jcrop({
			onChange: updatePreview,
			onSelect: updatePreview,
			onSelect: updateCoords,
			aspectRatio: xsize / ysize,
			setSelect: [ data.width, data.height, 0, 0 ],
			trueSize: [ orig_w, orig_h ]
		}, function(){
			// Use the API to get the read image size
			var bounds = this.getBounds();
			boundx = bounds[0];
			boundy = bounds[1];
			// Store the API in the jcrop container for css positioning
			jcrop_api = this;

			// Move the preview into the jcrop container for css positioning
			$preview.appendTo(jcrop_api.ui.holder);

		});

		function updateCoords(c) {
			// update global coordinates
            x = c.x;
            y = c.y;
            w = c.w;
            h = c.h;

            $('.dims').html( x + ' x ' + y );
		}

		function updatePreview(c) {
			if (parseInt(c.w) > 0) {
				var rx = xsize / c.w;
				var ry = ysize / c.h;

				$pimg.css({
					width: Math.round(rx * boundx) + 'px',
					height: Math.round(ry * boundy) + 'px',
					marginLeft: '-' + Math.round(rx * c.x) + 'px',
					marginTop: '-' + Math.round(ry * c.y) + 'px'
				});
			}
            var leftcol = $('#leftcol');
            $('.leftcol').html($(leftcol).width() + ' x ' + $(leftcol).height() );
		};
	}
})