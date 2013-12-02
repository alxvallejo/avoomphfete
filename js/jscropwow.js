jQuery(document).ready(function($){
    //console.log('here');
	var img = $('.oomph-edit-image');
	var imgContainer = $(img).parent();
    var $image_link = imgContainer.find('.oomph-edit-image-link');
    var image_container = $(img).closest('.oomph-edit-image-container');

    // TB Window sizes
    var tb_width = $(window).width() * 0.9;
    var tb_height = $(window).height() * 0.9;

    // Resize?
    /*$(window).resize(function(){
        var W = $(window).width();
        var H = $(window).height();
    });*/

    // Declare window and content objects for passing between animate methods
    var windowdims = {

    }

    var tbdims = {
        padding : 10
    }

    var thumbnail_width = image_container.width(); // Used to compare with document width and compare with preview thumbnail

    var target_filename;
    var orig_img_url;

	var width = imgContainer.length > 0 ? imgContainer.width() : 0;
	var height = imgContainer.length > 0 ? imgContainer.height() : 0;
	var aspect_ratio = width / height;

	//articleId = $(img).closest('article').attr('id').match(/[\d]+$/);

	$(img).after('<div class="response"></div>');

	var sourceUrl = $(img).attr('src');

    $image_link.on('click', tbdims, function(event){ 
        thisImg = $(this).closest('.oomph-edit-image-container').find('img');
        //articleId = $(this).closest('article').attr('id').match(/[\d]+$/);
    	first_phase = {
    		action: 'jscropwow_find_img',
    		nonce: 'jscropwow_vars.nonce',
            src: thisImg.attr('src'),
            thumb_id: thisImg.attr('id'),
            container_width: thisImg.attr('width'),
            container_height: thisImg.attr('height')
    	}
    	$.ajax({
    		type: "GET",
    		url: jscropwow_vars.ajaxurl,
    		data: first_phase,
    		datatype: "json"
    	}).done(function(response){
            $('#TB_title').text('Front End Thumbnail Editor');
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

            var leftcol = $('#TB_ajaxContent #leftcol');
            var rightcol = $('#TB_ajaxContent #rightcol');
            var jcrop_holder = $('#TB_ajaxContent #jcrop-holder');
            var jcrop_target = $('#TB_ajaxContent #jcrop_target');
            var preview_container = $('#preview-pane .preview-container');
            var preview_pane = $('#preview-pane'); // parent div for preview container
            console.log('TB TOP ' + $(tb_window).position().top);
            $(tb_window).animate({
                marginLeft: 0 - (tb_width + 50) / 2,
                //marginTop: -50,
                //marginTop: '-144.35px',
                height: tb_height + 30,
                width: tb_width + 30
            }, 400, function() {
                var offset_left = $(this).offset().left;
                var tbdims = event.data;
                tbdims.w = $(document).width() - (offset_left * 2);

                //console.log( 'ANIMATE OFFSET ' + $(this).offset().left );

                $('#TB_ajaxContent').animate({
                    height: tb_height,
                    width: tb_width
                }, 400, function() {
                    $(this).width(tbdims.w - tbdims.padding);
                    // Regroup dimensions ******************
                    var leftcol_plus_preview_pane = $(leftcol).width() + $(preview_pane).width();
                    var preview_pane_left_position = $(leftcol).offset().left + $(jcrop_holder).width() + 10;
                    console.log('leftcol_plus_preview_pane ' + leftcol_plus_preview_pane);
                    console.log('preview_pane_left_position ' + preview_pane_left_position);

                    if( $(tb_content).width() > leftcol_plus_preview_pane ) {
                        $(preview_pane).css({'top':'inherit','left':preview_pane_left_position});
                    } else {
                        var preview_pane_top_position = 53 + $(jcrop_holder).height();
                        $(preview_pane).css({'top':preview_pane_top_position});
                    }
                });
            });

    		$('.loading').hide();    
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
            debugger;

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
                var leftcol = $('#leftcol');
                $('.leftcol').html($(leftcol).width() + ' x ' + $(leftcol).height() );
			};

            $('#save_img').on('click', function(){
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
                    //articleId: articleId,
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
    });

	
});