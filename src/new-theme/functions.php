<?php

define('THEME_DIR', get_template_directory());

/**
 * Add theme feature support
 */
function addThemeSupport() {
  add_theme_support('automatic-feed-links');
  add_theme_support('title-tag');
  add_theme_support('post-thumbnails');

  register_nav_menus(
    [
      'menu-1' => 'Main navigation menu',
    ]
  );

  add_theme_support(
    'html5',
    [
      'search-form',
      'comment-form',
      'comment-list',
      'gallery',
      'caption',
      'style',
      'script',
    ]
  );

  add_theme_support(
    'custom-logo',
    [
      'height'      => 250,
      'width'       => 250,
      'flex-width'  => true,
      'flex-height' => true,
    ]
  );
}

add_action('after_setup_theme', 'addThemeSupport');


/**
 * Register widget areas
 */
function registerWidgets() {
  register_sidebar([
  'name' => 'Header widget (1)',
  'id' => 'header-widget-1',
  'description' => 'Appears in the header, right side of navigation menu',
  'before_widget' => '<div id="%1$s" class="%2$s">',
  'after_widget' => '</div>'
  ]);
}

add_action('widgets_init', 'registerWidgets');


/**
 * Enqueue theme script and style
 */
function enqueueAssets() {
  wp_enqueue_style('theme', get_stylesheet_uri());
  wp_enqueue_script('theme', get_template_directory_uri() . '/bundle.min.js', [], '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'enqueueAssets');


/**
 * Disable WP emojis
 */
function disable_emojis() {
  remove_action('wp_head', 'print_emoji_detection_script', 7);
  remove_action('admin_print_scripts', 'print_emoji_detection_script');
  remove_action('wp_print_styles', 'print_emoji_styles');
  remove_action('admin_print_styles', 'print_emoji_styles');
  remove_filter('the_content_feed', 'wp_staticize_emoji');
  remove_filter('comment_text_rss', 'wp_staticize_emoji');
  remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
  add_filter('wp_resource_hints', 'disable_emojis_remove_dns_prefetch', 10, 2);
}

add_action('init', 'disable_emojis');


// Remove "generator" tag in header
remove_action('wp_head', 'wp_generator');


 /**
 * Remove emoji CDN hostname from DNS prefetching hints.
 *
 * @param array $urls URLs to print for resource hints.
 * @param string $relation_type The relation type the URLs are printed for.
 * @return array Difference betwen the two arrays.
 */
function disable_emojis_remove_dns_prefetch($urls, $relation_type) {
  if ('dns-prefetch' == $relation_type) {
    /** This filter is documented in wp-includes/formatting.php */
    $emoji_svg_url = apply_filters('emoji_svg_url', 'https://s.w.org/images/core/emoji/2/svg/');

    $urls = array_diff($urls, array($emoji_svg_url));
  }

  return $urls;
}


/**
 * Remove Gutenberg Block Library CSS from loading on the frontend
 */
function smartwp_remove_wp_block_library_css(){
  wp_dequeue_style('wp-block-library');
  wp_dequeue_style('wp-block-library-theme');
  wp_enqueue_script('jquery');
}

add_action('wp_enqueue_scripts', 'smartwp_remove_wp_block_library_css');
