/* eslint-env browser */
import jQuery from 'jquery';

(function(window, $) {
  'use strict';

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );

  if ('serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || isLocalhost)) {
    navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
      // updatefound is fired if service-worker.js changes.
      registration.onupdatefound = function() {
        // updatefound is also fired the very first time the SW is installed,
        // and there's no need to prompt for a reload at that point.
        // So check here to see if the page is already controlled,
        // i.e. whether there's an existing service worker.
        if (navigator.serviceWorker.controller) {
          // The updatefound event implies that registration.installing is set:
          // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
          var installingWorker = registration.installing;

          installingWorker.onstatechange = function() {
            switch (installingWorker.state) {
              case 'installed':
                // At this point, the old content will have been purged and the
                // fresh content will have been added to the cache.
                // It's the perfect time to display a 'New content is
                // available; please refresh.' message in the page's interface.
                break;

              case 'redundant':
                throw new Error('The installing ' +
                                'service worker became redundant.');

              default:
                // Ignore
            }
          };
        }
      };
    }).catch(function(e) {
      console.error('Error during service worker registration:', e);
    });
  }

  // Your custom JavaScript goes here
  /** {boolean} Whether an AJAX post is pending. */
  let submissionInProgress = false;

  // Handle form submissions.
  $('#signup').on('submit', function(e) {
    // Prevent multiple form submissions.
    if (submissionInProgress) {
      return false;
    }

    /** {jQuery} The submitted form. */
    const $form = $(this);

    /** {string} The value of the email field. */
    const email = $form.find('[name="email"]').val();

    /** {jQuery} The cached submission button. */
    const $submitButton = $form.find('.btn-submit');

    /** {string} The initial text of the submit button. */
    const submitText = $submitButton.html();

    /** {RegExp} A simple email validation. */
    const emailRegex = /.+@.+/;

    e.preventDefault();
    $form.find('.form-message').addClass('hidden');

    // Redundant email validation for Safari, or other browsers that don't
    // support HTML5 form validation.
    if (!emailRegex.test(email)) {
      $('#invalid-email').removeClass('hidden');
      return false;
    }

    // Submit the AJAX request and deal with its response.
    submissionInProgress = true;
    $form.find('.btn-submit').attr('disabled', 'disabled')
        .html('Loading&hellip;');
    $.post($form.attr('action'), {
      email: email
    }).done(() => {
      $('#email-success').removeClass('hidden');
      $('#email').blur();
    }).fail(xhr => {
      if (xhr.status === 0) {
        // Safari tries to send an OPTIONS request to Google Apps, which fails
        // with 405 Method Not Allowed, although jQuery receives a status code
        // of 0. In this case, though, the script actually succeeds.
        // <https://github.com/DevProgress/swear-jar/issues/34>
        $('#email-success').removeClass('hidden');
        $('#email').blur();
      } else {
        $('#server-error').removeClass('hidden');
      }
    }).always(() => {
      $form.find('.btn-submit').removeAttr('disabled').html(submitText);
      submissionInProgress = false;
    });
  });

  $(document).on('click', '.share-fb', e => {
    e.preventDefault();
    const shareMessage = $(e.currentTarget).data('message');
    const shareUrl = $(e.currentTarget).data('url') || window.location;

    const shareOptions = {
      method: 'share',
      href: shareUrl
    };

    if (shareMessage) {
      shareOptions.quote = shareMessage;
    }

    window.FB.ui(shareOptions, function() {
      const $overlayParent = $(e.currentTarget).parents('.overlay');
      if ($overlayParent.length) {
        $overlayParent.addClass('hidden');
      }
    });
  });

  $('.overlay').on('click', '.close-overlay', e => {
    $(e.delegateTarget).addClass('hidden');
  });
})(window, jQuery);
