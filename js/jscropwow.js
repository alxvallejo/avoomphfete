jQuery(document).ready(function($){
    //console.log('here');
	img = $('.oomph-edit-image');
	var imgContainer = $(img).parent();
    var $image_link = imgContainer.find('.oomph-edit-image-link');
    image_container = $(img).closest('.oomph-edit-image-container');

    var target_filename;
    var orig_img_url;

	width = imgContainer.length > 0 ? imgContainer.width() : 0;
	height = imgContainer.length > 0 ? imgContainer.height() : 0;
	var aspect_ratio = width / height;

	articleId = $(img).closest('article').attr('id').match(/[\d]+$/);

	$(img).after('<div class="response"></div>');

	sourceUrl = $(img).attr('src');

	save_button = $('#save_img');

    $image_link.on('click', function(){
        thisImg = $(this).closest('.oomph-edit-image-container').find('img');
        articleId = $(this).closest('article').attr('id').match(/[\d]+$/);
        console.log('image link clicked');
    	first_phase = {
    		action: 'jscropwow_find_img',
    		nonce: 'jscropwow_vars.nonce',
    		articleId: articleId,
            src: thisImg.attr('src'),
            thumbId: thisImg.attr('id'),
            width: thisImg.attr('width'),
            height: thisImg.attr('height')
    	}
    	$.ajax({
    		type: "GET",
    		url: jscropwow_vars.ajaxurl,
    		data: first_phase,
    		datatype: "json"
    	}).done(function(response){
            console.log(response);
    		$('.loading').hide();
    		var tb_ajaxcontent = $('#TB_ajaxContent');
    		var leftcol = $('#TB_ajaxContent #leftcol');
    		var jcrop_target = $('#TB_ajaxContent #jcrop_target');
    		var preview_window = $('#preview-pane .preview-container');

    		var parse = jQuery.parseJSON(response);
    		fimg = parse['thumbnail'];
    		full_src = parse['full_src'];
    		thumbnail_id = parse['thumbnail_id'];
    		thumbnail_post_title = parse['name'];
    		orig_w = parse['orig_w'];
    		orig_h = parse['orig_h'];
            target_filename = parse['target_filename'];
            orig_img_url = parse['full_src'];
            console.log( 'target path is ' + target_filename );
            nonce = parse['nonce'];
            
    		//original_thumb_url =
            $(jcrop_target).empty();
            $(preview_window).empty();
    		$(jcrop_target).html(fimg);
    		$('img', jcrop_target).attr('id', 'target');
    		$(preview_window).html(fimg);
    		var preview_img = $('img', preview_window);
    		$(preview_img).attr('class', 'jcrop_preview');

    		var target = $('#TB_ajaxContent #jcrop_target img');

    		// logic for initial crop area is determined by preview container
    		$('#preview-pane .preview-container').width(width);
    		$('#preview-pane .preview-container').height(height);

    		var jcrop_api,
    			boundx,
    			boundy,

    			// Grab some preview information from the preview pane
    			$preview = $('#preview-pane'),
    			$pcnt = $('#preview-pane .preview-container'),
    			$pimg = $('#preview-pane .preview-container img'),

    			xsize = $pcnt.width(),
    			ysize = $pcnt.height();

    		console.log('init', [xsize, ysize]);

    		$(target).Jcrop({
    			onChange: updatePreview,
    			onSelect: updatePreview,
    			onSelect: updateCoords,
    			aspectRatio: xsize / ysize,
    			setSelect: [ width, height, 0, 0 ],
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
			};
		});
    });

	$(save_button).on('click', function(){
        console.log('save to path ' + target_filename);
		    $('#TB_window').fadeOut( function(){
                $('#TB_window').remove();
            });
	    	$('#TB_overlay').fadeOut(function(){
                $('#TB_overlay').remove();
            });

		save_phase = {
    		action: 'jscropwow_save_img',
    		nonce: 'jscropwow_vars.nonce',
    		articleId: articleId,
    		sourceUrl: full_src,
    		thumbnail_id: thumbnail_id,
    		image_title: thumbnail_post_title,
            target_filename: target_filename,
            orig_img_url: orig_img_url,
    		x: x,
    		y: y,
    		w: w,
    		h: h,
    		width: width,
    		height: height
    	}
    	//console.log(save_phase);
    	$.ajax({
    		type: "GET",
    		url: jscropwow_vars.ajaxurl,
    		data: save_phase,
    		datatype: "json"
    	}).done(function(response){
	    	var parse = jQuery.parseJSON(response);
	    	newImgUrl = parse['new_img_url'];
	    	$(thisImg).attr('src',newImgUrl);
    	});

        // Use wp core function to save
        /*
        No luck saving here. Saves malformed attachment
        */
       /* var historyArray = [{"c": {"x":x,"y":y,"w":w,"h":h}}];
        var history = JSON.stringify(historyArray);
        core_save_phase = {
            action: 'image-editor',
            _ajax_nonce: nonce,
            postid: thumbnail_id,
            articleId: articleId,
            history: history,
            target: 'all',
            context: 'edit-attachment',
            do: 'save'                  
        }
        console.log(core_save_phase);
        $.ajax({
            type: "POST",
            url: jscropwow_vars.ajaxurl,
            data: core_save_phase,
            datatype: "json"
        }).done(function(response){
            event.preventDefault();
            $('#TB_window').fadeOut();
            $('#TB_overlay').fadeOut();

            var parse = jQuery.parseJSON(response);
            //console.log(response);
            newImgUrl = parse['new_img_url'];
            $(img).attr('src',newImgUrl);
        });*/



        return false;
	});
});