jQuery(document).ready(function($){
    //console.log('here');
	img = $('.oomph-edit-image');
	var imgContainer = $(img).parent();
    var $image_link = imgContainer.find('.oomph-edit-image-link');
    image_container = $(img).closest('.oomph-edit-image-container');

    // TB Window sizes
    var tb_width = $(window).width() * 0.9;
    var tb_height = $(window).height() * 0.9;

    // Resize?
    /*$(window).resize(function(){
        var W = $(window).width();
        var H = $(window).height();
    });*/

    var thumbnail_width = image_container.width(); // Used to compare with document width and compare with preview thumbnail

    var target_filename;
    var orig_img_url;
    var width;
    var height;

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

            var parse = jQuery.parseJSON(response);
            // Parse response request and assign variables
            var fimg = parse['thumbnail'];
            var full_src = parse['full_src'];
            var thumbnail_id = parse['thumbnail_id'];
            var thumbnail_post_title = parse['name'];
            var orig_w = parse['orig_w'];
            var orig_h = parse['orig_h'];
            var target_filename = parse['target_filename'];
            var orig_img_url = parse['full_src'];
            console.log( 'target path is ' + target_filename );
            var nonce = parse['nonce'];

            console.log(fimg);

            var tb_window = $('#TB_window');
            var tb_content = $('#TB_ajaxContent');


            $(tb_content).html( parse['output_buffer'] );

            $(tb_window).animate({
                marginLeft: 0 - (tb_width + 50) / 2,
                marginTop: 0 - (tb_height + 30) / 2,
                height: tb_height + 30,
                width: tb_width + 30
            }, 400, function() {
                console.log( 'ANIMATE OFFSET ' + $(this).offset().left );
            });

            $('#TB_ajaxContent').animate({
                height: tb_height,
                width: tb_width
            }, {
                duration: 400
            });

    		$('.loading').hide();
    		
    		var leftcol = $('#TB_ajaxContent #leftcol');
            var rightcol = $('#TB_ajaxContent #rightcol');
    		var jcrop_target = $('#TB_ajaxContent #jcrop_target');
    		var preview_container = $('#preview-pane .preview-container');
            var preview_pane = $('#preview-pane'); // parent div for preview container

            // Regroup dimensions ******************

            // 
            var tb_window_height = $(tb_window).height();
            var tb_window_width = $(tb_window).width();

            var tb_window_offset = $('#TB_window').offset();
            //var tb_window_right = 
            var rightcol_offset = $(rightcol).offset();
            //console.log('OFFSET' + rightcol_offset);
            var preview_space = $(tb_content).width() - ( rightcol_offset.left + $(rightcol).width() );
            console.log('$(tb_content).width()  ' + $(tb_content).width());
            console.log('tb_window_offset.left  ' + tb_window_offset.left);
            console.log('rightcol_offset.left  ' + rightcol_offset.left);
            console.log('rightcol_offset.left + $(rightcol).width().left  ' + rightcol_offset.left + $(rightcol).width());

            if( ((preview_space - thumbnail_width) - thumbnail_width) > 20 ) { // Choose proper right margin for preview window
                console.log('yesss');
                $(preview_pane).css({'top':0,'left':'20px'});
            } else {
                console.log('OK THEN ' + (preview_space - thumbnail_width) - thumbnail_width);
            }

    		console.log(preview_space);
    		
            
    		//original_thumb_url =
            $(jcrop_target).empty();
            $(preview_container).empty();
    		$(jcrop_target).html(fimg);
    		$('img', jcrop_target).attr('id', 'target');
    		$(preview_container).html(fimg);

    		var preview_img = $('img', preview_container);
    		$(preview_img).attr('class', 'jcrop_preview');

    		var target = $('#TB_ajaxContent #jcrop_target img');

    		// logic for initial crop area is determined by preview container
    		$(preview_container).width(width);
    		$(preview_container).height(height);

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