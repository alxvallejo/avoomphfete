<?php
/*
Plugin Name:	Oomph Front End Thumbnail Editor
Plugin URI:		http://www.thinkoomph.com/wordpress-plugins/oomph-front-end-thumbnail-editor/
Description:	A brief description of the plugin
Version:		1.0
Author:			John Patz and Alex Vallejo
Author URI:		http://www.thinkoomph.com/
License: 		GPLv2
*/

/*
Copyright 2013  PLUGIN_AUTHOR_NAME  (email : PLUGIN AUTHOR EMAIL)
This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details. You should have received a copy of the GNU General Public License along with this program; if not, write to the Free Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

register_activation_hook( __FILE__, 'oomph_fete_install' );
register_deactivation_hook( __FILE__, 'oomph_fete_uninstall' );

function oomph_fete_install() {
}

function oomph_fete_uninstall() {
}

class Oomph_Front_End_Thumbnail_Editor {
	// Define and register singleton
	private static $instance = false;
	public static function instance() {
		if( !self::$instance )
			self::$instance = new Oomph_Front_End_Thumbnail_Editor; // MUST BE UPDATED WITH CLASS NAME
		return self::$instance;
	}

	// Disallow clone() of object
	private function __clone() { }

	// CPT registration, custom taxonomy registration, actions, filters
	private function __construct() {
		add_action( 'init', array( $this, 'action_init' ) );
	}

	function action_init() {
		// Check if admin is logged in
		if( !is_user_logged_in() || !current_user_can( 'manage_options' ) )
			return;

		//require( __DIR__ . '/inc/jscropwow.php' );


		add_action( 'wp_enqueue_scripts', array( $this, 'action_wp_enqueue_scripts' ) );
		add_filter( 'post_thumbnail_html', array( $this, 'filter_post_thumbnail_html' ), 10, 5 );
		//add_filter( 'home_template', array( $this, 'jscropwow_tb' ), 10, 2 );
		add_action( 'wp_ajax_jscropwow_save_img', array( $this, 'jscropwow_save_img' ) );
		add_action( 'wp_ajax_jscropwow_find_img', array( $this, 'jscropwow_find_img' ) );
	}

	function action_wp_enqueue_scripts() {
		wp_register_style( 'oomph-front-end-thumbnail-editor', plugins_url( 'css/oomph-front-end-thumbnail-editor.css', __FILE__ ), array(), 1.0 );
		wp_register_script( 'jscropwow', plugins_url( 'js/jscropwow.js', __FILE__ ), array( 'jquery', 'thickbox' ), 1.0 );

		wp_enqueue_style( 'oomph-front-end-thumbnail-editor' );
		wp_enqueue_script( 'oomph-front-end-thumbnail-editor', plugins_url( 'js/oomph-front-end-thumbnail-editor.js', __FILE__ ), array( 'jquery' ), 1.0 );
		wp_enqueue_script( 'thickbox' );
		wp_enqueue_style( 'thickbox' );
		wp_enqueue_script( 'jcrop' );
		wp_enqueue_style( 'jcrop' );
		
		wp_enqueue_script( 'jscropwow' );
		wp_localize_script( 'jscropwow', 'jscropwow_vars', array( 'ajaxurl' => home_url( 'wp-admin/admin-ajax.php' ), 'nonce' => wp_create_nonce( 'jscropwow_nonce' ) ) );
	}

	function filter_post_thumbnail_html( $html, $post_id, $post_thumbnail_id, $size, $attr ) {
		return preg_replace( '/class="(.*?)"/i', 'id="' . $post_thumbnail_id . '"class="$1 oomph-edit-image"', $html );
	}

	function jscropwow_find_img() {

		if( ! $post_id = intval( $_GET['articleId'][0] ) )
			return false;

		if( ! $post = get_post( $post_id ) )
			return false;

		/* Check for thumbnail ID */
		if( !empty( $_GET['thumbId'] ) && is_int( $_GET['thumbId'] ) )
			$post_thumbnail_id = $_GET['thumbId'];
		else
			$post_thumbnail_id = get_post_thumbnail_id( $post_id );

		/* Check for post thumbnail */
		if( has_post_thumbnail( $post_id ) == false ) {
			oomph_error_log( 'This post has no thumbnail' );
			return false;
		}

		/* Get full size image element */
		$large_post_thumbnail = get_the_post_thumbnail( $post_id, 'full' );

		/* Get thumbnail src */
		$src = $_GET['src'];

		/* If width and height img parameters are passed, get the intermediate size for this post and pass along the path and dimensions */
		if( !isset( $_GET['width'] ) || !isset( $_GET['height'] ) ) {
			oomph_error_log( 'width or height is not set' );
			return false;
		}

		$intermediate_size = image_get_intermediate_size( $post_thumbnail_id, array( $_GET['width'], $_GET['height'] ));
		oomph_error_log( 'post_thumbnail_id', $post_thumbnail_id );
		oomph_error_log( 'dims', array( $_GET['width'], $_GET['height'] ) );
 
		$full_size = image_get_intermediate_size( $post_id, 'full' );

		/* Compare filename against original to prevent overwriting the original */
		if( $full_size['file'] == $intermediate_size['file'] ) {
			oomph_error_log( '$intermediate_size', $intermediate_size );
			$target_filename = 'original';
		} else {
			// Pass along the path of the intermediate size to be overwritten
			$target_filename = $intermediate_size['file'];
		}
		
		$full_post_thumbnail_src = wp_get_attachment_image_src( $post_thumbnail_id, 'full' );
		//oomph_error_log( '$full_post_thumbnail_src', $full_post_thumbnail_src );
		$thumb_obj = get_post( $post_thumbnail_id );

		// Check if this post thumbnail is a new crop and grab the original img src
		if( $original_src = get_post_meta( $post_thumbnail_id, 'original-thumbnail', true ) ) {
			$src = $original_src;
		} else {
			$src = $full_size[0];
		}
		$thumb_title = $thumb_obj->post_title;
		$nonce = wp_create_nonce("image_editor-" . $post_thumbnail_id);
		$output_buffer = $this->jscropwow_tb();

		$response = array(
			'thumbnail' => $large_post_thumbnail,
			'thumbnail_id' => $post_thumbnail_id,
			'src' => $src,
			'name' => $thumb_title,
			'full_src' => $full_post_thumbnail_src[0],
			'orig_w' => $full_post_thumbnail_src[1],
			'orig_h' => $full_post_thumbnail_src[2],
			'target_filename' => $target_filename,
			'nonce' => $nonce,
			'output_buffer' => $output_buffer
		);
		echo json_encode($response);
		die();
	}


	function jscropwow_tb() {
		ob_start(); // Return the output buffer in the first ajax response
		?>
		<div id="jscropwow_tb">
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
					leftcol: <div class="leftcol"></div>

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
		return ob_get_clean();
	}

	function jscropwow_save_img() {

		// meta key for parent post
		$meta_key = 'jscropwow';

		// Define postfix to file
		$postfix = '-newcrop.jpg';

		$image_title = $_GET['image_title'] ? $_GET['image_title'] : '';

		$uploads_dir = wp_upload_dir();

		if( isset( $_GET['sourceUrl'] ) ) {
			$src = $_GET['sourceUrl'];
			//oomph_error_log( 'src', $_GET['sourceUrl'] );
			//echo 'src ' . $src;
		} else { echo 'no source url'; }

		/* Get full src for saving */
		$orig_img_url = $_GET['orig_img_url'];

		if( !empty( $_GET['target_filename'] ) && 'original' !== $_GET['target_filename'] ) {
			$target_filename = $_GET['target_filename'];
		} else {
			$target_filename = $image_title . $postfix;
			$full_src = $uploads_dir['path'] . '/' . $target_filename;
		}

		oomph_error_log( 'target_filename', $target_filename );

		/*bool imagecopyresampled (
			resource $dst_image , resource $src_image ,
			int $dst_x , int $dst_y ,
			int $src_x , int $src_y ,
			int $dst_w , int $dst_h ,
			int $src_w , int $src_h
		)*/

		$img_r = imagecreatefromjpeg( $src );

		$jpeg_quality = 100;

	    $dst_r = wp_imagecreatetruecolor( $_GET['width'], $_GET['height'] );
	    $dst_path = $uploads_dir['path'] . '/' . $target_filename;
	    $dst_url = $uploads_dir['url'] . '/' . $target_filename;

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
	    /*m*/
	    //$attach_id = wp_insert_attachment( $attachment, $dst_path, $parent_post_id );

	    // Save original thumbnail id in attachment post meta
	    //update_post_meta( $parent_post_id, 'original-thumbnail', $filename );

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

		die();
	}
	
}
Oomph_Front_End_Thumbnail_Editor::instance();