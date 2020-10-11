<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="profile" href="https://gmpg.org/xfn/11">
  <?php wp_head(); ?>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400;1,500&display=swap" rel="stylesheet">
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="site-header">
  <div class="container grid">
    <div class="site-header__main">
      <div class="site-branding">
        <?php
          has_custom_logo()
            ? the_custom_logo()
            : print('<a href="/" class="site-branding__logotype">' . get_bloginfo('name') . '</a>');
        ?>
      </div>

      <nav class="main-navigation">
        <button class="main-navigation__toggle" aria-controls="primary-menu" aria-expanded="false">Menu</button>
        <?php
          wp_nav_menu([
            'theme_location' => 'menu-1',
            'menu_id' => 'primary-menu'
          ]);
        ?>
      </nav>
    </div>

    <div class="site-header__aside">
      <?php
        if (is_active_sidebar('header-widget-1')) {
          dynamic_sidebar('header-widget-1');
        }
      ?>
    </div>
  </div>
</header>
