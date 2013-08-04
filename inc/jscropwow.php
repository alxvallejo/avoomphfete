<?php
function jscropwow_load_scripts() {
	/*wp_register_script( 'jscropwow', plugin_dir_url(__DIR__) . 'js/jscropwow.js', array( 'jquery', 'thickbox' ) );
	wp_enqueue_script( 'jscropwow' );
	wp_localize_script( 'jscropwow', 'jscropwow_vars', array( 'ajaxurl' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce( 'jscropwow_nonce' ) ) );
	oomph_error_log( admin_url( 'admin-ajax.php' ) );*/
}

function jscropwow_conditional_load_scripts() {
	if( is_admin() ){
		jscropwow_load_scripts();
	} else {
		jscropwow_load_scripts();
	}
}
add_action( 'wp_enqueue_scripts', 'jscropwow_conditional_load_scripts' );

function jscropwow_find_img() {
	oomph_error_log( 'here' );
	$post_id = isset( $_GET['articleId'][0] ) ? $_GET['articleId'][0] : '';
	if( empty( $post_id ) )
		echo 'empty post id';
	else
		$post = get_post( $post_id );
	if( empty( $post_id ) )
		echo 'No post found';

	if( has_post_thumbnail( $post_id ) ) {
		$large_post_thumbnail = get_the_post_thumbnail( $post_id, 'full' );

		oomph_error_log( '$large_post_thumbnail', $large_post_thumbnail );
		//$medium_post_thumbnail = get_the_post_thumbnail( $post_id, 'medium' );
		$post_thumbnail_id = get_post_thumbnail_id( $post_id );
		$full_post_thumbnail_src = wp_get_attachment_image_src( $post_thumbnail_id, 'full' );
		oomph_error_log( '$full_post_thumbnail_src', $full_post_thumbnail_src );
		$thumb_obj = get_post( $post_thumbnail_id );

		// Check if this post thumbnail is a new crop and grab the original img src
		if( $original_src = get_post_meta( $post_thumbnail_id, 'original-thumbnail', true ) ) {
			$src = $original_src;
		} else {
			$src = wp_get_attachment_image_src( $post_thumbnail_id, 'full' );
		}
		oomph_error_log( 'src', $src );
		$thumb_title = $thumb_obj->post_title;

		$response = array(
			'thumbnail' => $large_post_thumbnail,
			'thumbnail_id' => $post_thumbnail_id,
			'src' => $src,
			'name' => $thumb_title,
			'full_src' => $full_post_thumbnail_src[0],
			'orig_w' => $full_post_thumbnail_src[1],
			'orig_h' => $full_post_thumbnail_src[2]
		);
		echo json_encode($response);
	} else {
		echo 'This post has no thumbnail';
	}
	die();
}


function jscropwow_tb( $image_id ) {
	?>
	<div id="jscropwow_tb" style="display:none;">
		<h2>Edit Thumbnail Image Crop</h2>
		<div class='loading'>
			<img src="<?php echo includes_url( 'images/wpspin-2x.gif' ); ?>" />
		</div>
		<div id="jcrop-holder">
			<div id="leftcol">
				<div id="jcrop_target"></div>
			</div>
			<div id="rightcol">
				<h5>Preview Thumbnail</h5>
				Dimensions: <div class="dims"></div>

				<!-- This is the form that our event handler fills -->
		        <button id="save_img">Save Thumbnail</button>

				<div id="preview-pane">
					<div class="preview-container">

					</div>
				</div>
			</div>
		</div>
	</div>
	<?php
}
//add_filter( 'home_template', 'jscropwow_tb' );

function jscropwow_save_img() {
	if( isset( $_GET['x'] ) ){

		// meta key for parent post
		$meta_key = 'jscropwow';

		// Define postfix to file
		$postfix = '-newcrop.jpg';

		$filename = $_GET['filename'] ? $_GET['filename'] : '';
		oomph_error_log( 'filename', $filename );

		$uploads_dir = wp_upload_dir();
		if( isset( $_GET['sourceUrl'] ) ) {
			$src = $_GET['sourceUrl'];
			oomph_error_log( 'src', $_GET['sourceUrl'] );
			//echo 'src ' . $src;
		} else { echo 'no source url'; }

		/*bool imagecopyresampled (
			resource $dst_image , resource $src_image ,
			int $dst_x , int $dst_y ,
			int $src_x , int $src_y ,
			int $dst_w , int $dst_h ,
			int $src_w , int $src_h
		)*/

		$img_r = imagecreatefromjpeg( $src );

		$jpeg_quality = 100;

	    $dst_r = imagecreatetruecolor( $_GET['width'], $_GET['height'] );
	    $dst_path = $uploads_dir['path'] . '/' . $_GET['filename'] . $postfix;
	    $dst_url = $uploads_dir['url'] . '/' . $_GET['filename'] . $postfix;

	    imagecopyresampled(
	    	$dst_r, $img_r,
	    	0, 0,
	    	$_GET['x'], $_GET['y'],
	    	$_GET['width'], $_GET['height'],
	    	$_GET['w'], $_GET['h']
	    );
	    //oomph_error_log( '$dst_path', $dst_path );

	    imagejpeg( $dst_r, $dst_path, $jpeg_quality );

		$wp_filetype = wp_check_filetype( basename( $dst_path ), null );
		$parent_post_id = $_GET['articleId'] ? $_GET['articleId'][0] : '';

	    // Build attachment array for saving to post
	    $attachment = array(
	    	'guid' => $dst_path,
	    	'post_mime_type' => $wp_filetype['type'],
	    	'post_title' => $_GET['filename'] . '-newcrop',
	    	'post_content' => '',
	    	'post_status' => 'inherit'
	    );
	    //$attach_id = wp_insert_attachment( $attachment, $dst_path, $parent_post_id );

	    // Save original thumbnail id in attachment post meta
	    update_post_meta( $parent_post_id, 'original-thumbnail', $filename );

	    //oomph_error_log( '$attach_id', $attach_id );
	    //oomph_error_log( '$parent_post_id', $parent_post_id );
	    //set_post_thumbnail( $parent_post_id, $attach_id );

	    $response = array(
	    	'new_img_url' => $dst_url
	    );
	    echo json_encode($response);



	    // Save new thumbnail to this post
	    /*if( isset( $_GET['articleId'] ) ) {
	    	$post_id = $_GET['articleId'];
	    	$post = get_post( $post_id );
	    	if( $post ) {
	    		/*$attach_id = wp_insert_attachment( )
	    		$set_thumbnail = set_post_thumbnail( $post_id, )*/



	    /*header('Content-type: image/jpeg');
	    imagejpeg($dst_r,null,$jpeg_quality);*/

	} else { echo 'no'; }
	die();
}
add_action( 'wp_ajax_jscropwow_save_img', 'jscropwow_save_img' );
