<?php

function getSiteUrl() {
  $siteUrl = strpos($_SERVER['SERVER_PROTOCOL'], 'HTTPS') > -1 ? 'https://' : 'http://';

  $siteUrl .= $_SERVER['SERVER_NAME'];

  if ($_SERVER['SERVER_PORT'] !== '80') {
    $siteUrl .= ':' . $_SERVER['SERVER_PORT'];
  }

  $siteUrl .= '/';

  return $siteUrl;
}

function getSiteTitle() {
  $siteTitle = get_bloginfo('name');

  $siteTitle .= ' - ';

  $siteTitle .= (is_front_page())
    ? get_bloginfo('description')
    : get_the_title();

  return $siteTitle;
}

define('THEME_DIR', get_template_directory());
define('PUBLIC_THEME_DIR', get_template_directory_uri());
define('SITE_URL', getSiteUrl());

$themeVariant = 'dark';
$preFooterWhiteBackground = false;

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
      'menu-footer-1' => 'Footer menu 1',
      'menu-footer-2' => 'Footer menu 2',
      'menu-footer-3' => 'Footer menu 3',
      'menu-footer-4' => 'Footer menu 4',
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

  register_sidebar([
    'name' => 'Footer menu widget (1)',
    'id' => 'footer-menu-1',
    'before_widget' => '<div id="%1$s" class="footer-menu">',
    'after_widget' => '</div>'
  ]);

  register_sidebar([
    'name' => 'Footer menu widget (2)',
    'id' => 'footer-menu-2',
    'before_widget' => '<div id="%1$s" class="footer-menu">',
    'after_widget' => '</div>'
  ]);

  register_sidebar([
    'name' => 'Footer menu widget (3)',
    'id' => 'footer-menu-3',
    'before_widget' => '<div id="%1$s" class="footer-menu">',
    'after_widget' => '</div>'
  ]);

  register_sidebar([
    'name' => 'Footer menu widget (4)',
    'id' => 'footer-menu-4',
    'before_widget' => '<div id="%1$s" class="footer-menu">',
    'after_widget' => '</div>'
  ]);

  register_sidebar([
    'name' => 'Footer copyright widget (1)',
    'id' => 'footer-widget-1',
    'description' => 'Appears on the left side in the footer',
    'before_widget' => '<div id="%1$s" class="page-footer__copyright-section">',
    'after_widget' => '</div>'
  ]);

  register_sidebar([
    'name' => 'Footer copyright widget (2)',
    'id' => 'footer-widget-2',
    'description' => 'Appears centered in the footer',
    'before_widget' => '<div id="%1$s" class="page-footer__copyright-section">',
    'after_widget' => '</div>'
  ]);

  register_sidebar([
    'name' => 'Footer copyright widget (3)',
    'id' => 'footer-widget-3',
    'description' => 'Appears on the right side in the footer',
    'before_widget' => '<div id="%1$s" class="page-footer__copyright-section">',
    'after_widget' => '</div>'
  ]);
}

add_action('widgets_init', 'registerWidgets');


/**
 * Make widget titles in footer H6 elements
 */

function changeWidgetTitle($params) {
  $params[0]['before_title'] =  '<h6 class="footer-menu__title">' ;
  $params[0]['after_title'] =  '</h6>' ;
  return $params;
}
add_filter('dynamic_sidebar_params', 'changeWidgetTitle');


/**
 * Enqueue theme script and style
 */
function enqueueAssets() {
  wp_enqueue_style('theme', get_stylesheet_uri());
  wp_enqueue_script('theme', get_template_directory_uri() . '/bundle.min.js', [], '1.0.0', true);

  define('SITE_TITLE', getSiteTitle());
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

/**
 * Disable comments
 */

function remove_menus() {
  remove_menu_page('edit-comments.php');
}

add_action('admin_menu', 'remove_menus');

function currentYear() {
  return date('Y');
}

add_shortcode('current_year', 'currentYear');

add_filter( 'gettext_with_context', 'wpse_75445_use_pretty_dash', 10, 2 );

function wpse_75445_use_pretty_dash($text, $context) {
  if ($text == '&#8211;') {
    $text = '&#45;';
  }
  return $text;
}
