jQuery(document).ready(function($) {

	$('.oomph-edit-image').each(function() {
		var $image = $(this);
		var $image_width = $(this).attr('width');
		var $image_height = $(this).attr('height');
		var $image_container;
		var $image_link_position;
		var $image_src;
        var $image_link;


		$(this).wrap('<div class="oomph-edit-image-container"></div>');

		//$(this).after('<a class="oomph-edit-image-link thickbox" href="#TB_inline?width=500&height=500&inlineId=jscropwow_tb">Edit Image</a>');
		


		$image_container = $(this).parent();
		$image_link = $image_container.find('.oomph-edit-image-link');
		$image_link.hide();
		$image_link_position = $image_height - parseInt($image_link.css('height'));


		$image_link_height = $image_link_position + 'px';

		$image_link.css('top', $image_link_height);

		$image_container.mouseenter(function() {
			$image_link.fadeIn(400);
		}).mouseleave(function(){
			$image_link.fadeOut(100);
		});

		$image_link.on('click', function(e) {
			e.preventDefault();

			$image_src = $image.attr('src');
			//alert($image_src);

		});
	});
});