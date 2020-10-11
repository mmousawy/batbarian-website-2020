<?php
/**
 * Template name: Home
 */

require THEME_DIR . '/includes/header.php';

$headerImage = get_field('header_image');
?>

<main>
  <section class="topbar">
    <div class="container">
      <div class="topbar__newsletter">
        <?= get_field('top_bar_newsletter'); ?>
      </div>
      <div class="topbar__socials">
        <?php
          $socials = get_field('top_bar_socials');

          foreach($socials as $social) {
            echo <<<HTML
              <a class="social-icon-wrapper" target="_blank" rel="nofollower" href="{$social['social_url']}" title="Visit Batbarian on {$social['social_name']}">
                <img class="social-icon" src="{$social['social_icon']['url']}" alt="{$social['social_name']}">
                {$social['social_name']}
              </a>
            HTML;
          }
        ?>
      </div>
    </div>
  </section>

  <section class="header">
    <div class="container">
      <img
        class="header__image"
        srcset="<?= $headerImage['sizes']['medium'] ?> <?= $headerImage['sizes']['medium-width'] ?>w,
                <?= $headerImage['sizes']['medium_large'] ?> <?= $headerImage['sizes']['medium_large-width'] ?>w,
                <?= $headerImage['sizes']['large'] ?> <?= $headerImage['sizes']['large-width'] ?>w,
                <?= $headerImage['url'] ?> <?= $headerImage['width'] ?>w"
        src="<?= $headerImage['url'] ?>"
        alt="<?= $headerImage['alt'] ?>"
      >
    </div>
  </section>

  <section class="stores">
    <div class="container">
      <?php
        $storeLinks = get_field('store_links');

        foreach($storeLinks as $storeLink) {
          echo <<<HTML
            <a class="stores__icon-wrapper" target="_blank" rel="nofollower" href="{$storeLink['store_url']}" title="Get Batbarian on {$storeLink['store_name']}">
              Get Batbarian on {$storeLink['store_name']}
              <img class="stores__icon" src="{$storeLink['store_icon']['url']}" alt="{$storeLink['store_name']}">
            </a>
          HTML;
        }
      ?>
    </div>
  </section>

  <section class="trailer">
    <div class="container">
      <div class="trailer__wrapper">
        <?= get_field('trailer_video') ?>
      </div>
    </div>
  </section>

  <section class="game-plot-screenshots">
    <div class="game-plot-text container">
      <?= get_field('game_plot_text') ?>
    </div>

    <div class="gallery container">
      <?= do_shortcode('[acf_gallery_slider acf_field="screenshots" autoplay_speed="5000"]') ?>
    </div>
  </section>

    <section class="accolades">
      <div class="container">
        <?php
          $accolades = get_field('accolades');

          foreach($accolades as $accolade) {
            $accolade = $accolade['accolade'];
            ?>
            <div class="accolade-wrapper">
              <img
                class="accolade"
                srcset="<?= $accolade['sizes']['medium'] ?> 1024w,
                        <?= $accolade['sizes']['medium_large'] ?> 1280w"
                src="<?= $accolade['sizes']['medium_large'] ?>"
                alt="<?= $accolade['title'] ?>"
              >
            </div>
          <?php
          }
        ?>
      </div>
  </section>
</main>

<?php require THEME_DIR . '/includes/footer.php';
