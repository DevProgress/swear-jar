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
  // Initialize Firebase
  const config = {
    apiKey: 'AIzaSyCvg_xjgQ-XzqTgK_21HnnvHWN58vA3ICo',
    authDomain: 'devprogress-swearjar.firebaseapp.com',
    databaseURL: 'https://devprogress-swearjar.firebaseio.com',
    storageBucket: '',
    messagingSenderId: '159937394443'
  };
  window.firebase.initializeApp(config);

  /** {boolean} Whether an AJAX post is pending. */
  let submissionInProgress = false;

  /** {firebase.database} Firebase database. */
  const database = window.firebase.database();

  // Show/update pledge counter
  window.firebase.database().ref('count').on('value', function(snapshot) {
    $('#pledge-count').html(snapshot.val() + ' ');
    $('#pledge-count-wrapper').removeClass('hidden');
  });

  // Build dropdown data
  const dropDownData = {
    interrupts: {
      optionText: 'interrupts Hillary',
      bodyText: 'interrupts Hillary at the debate. We\'ll send you the results after the debate',
      shareMessage: 'I\'m pledging a quarter each time #TrumpInterruptsHillary and you can too!'
    },
    tweets: {
      optionText: 'tweets',
      bodyText: 'tweets. We\'ll tally up the tweets and remind you weekly',
      shareMessage: 'I\'m pledging a quarter each time #TrumpTweets and you can too!'
    }
  };

  // Build dropdown menu
  for (var key in dropDownData) {
    if (dropDownData.hasOwnProperty(key)) {
      $('ul.dropdown-menu').append(
        $('<li>').addClass('dropdown-item').attr('value', key).append(
          dropDownData[key].optionText
        )
      );
    }
  }

  // Dropdown
  let $form = $('form#signup');
  let selectedReasonFormField = $form.find('[name="reason"]');
  $('.dropdown-item').click(function(e) {
    setDropdownValue($(e.currentTarget).attr('value'));
  });

  function setDropdownValue(value) {
    // clear current selected
    $('ul.dropdown-menu li[selected]').removeAttr('selected');

    // Set the item as selected
    $('ul.dropdown-menu li[value=' + value + ']').attr('selected', 'true');

    var selectedValue = getSelectedReason();

    // Update text in header
    $('.reason').text(selectedValue.optionText);

    // Update text in main body (use display version)
    $('.display-reason').text(selectedValue.bodyText);

    // Update form value
    selectedReasonFormField.val(selectedValue.optionText);
  }

  function getSelectedReason() {
    return dropDownData[$('ul.dropdown-menu li[selected]').attr('value')];
  }

  // Set default dropdown value
  setDropdownValue('interrupts');

  /**
   * Creates a new entry in the Firebase database.
   * @param {string} email - The email of the pledge.
   * @param {string} reason - The motivation behind the pledge.
   * @param {number} amount - The amount of the pledge per reason occurence.
   * @return {firebase.Promise} - Can be used to know when the update is committed to the database.
   */
  function createPledge(email, reason, amount) {
    const data = {
      email: email,
      reason: reason,
      amount: amount,
      timestamp: window.firebase.database.ServerValue.TIMESTAMP
    };
    const newPostKey = database.ref().child('pledges').push().key;

    return window.firebase.auth().signInAnonymously().then(() => {
      return database.ref(`pledges/${newPostKey}`).update(data);
    });
  }

  /**
   * Increments the pledge count stored in Firebase.
   * We store this in a separate node so that we can allow read access to the count,
   * but not the data itself.
   * @return {firebase.Promise} - Can be used to know when the transaction is complete.
   */
  function incrementPledgeCount() {
    return window.firebase.auth().signInAnonymously().then(() => {
      return window.firebase.database().ref('count').transaction(
        function(currentValue) {
          return (currentValue || 0) + 1;
        });
    });
  }

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

    /** {string} The reason for the pledge.. */
    const reason = $form.find('[name="reason"]').val();

    /** {number} The amount being pledged. */
    const amount = parseFloat($form.find('[name="amount"]').val());

    /** {jQuery} The cached submission button. */
    const $submitButton = $form.find('.btn-submit');

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
    $form.find('.btn-submit').attr('disabled', 'disabled');

    createPledge(email, reason, amount).then(() => {
      $('#email-success').removeClass('hidden');
      $('#email').blur();
      $submitButton.removeAttr('disabled');
      submissionInProgress = false;
      incrementPledgeCount();
    }, error => {
      $('#server-error').removeClass('hidden');
      $submitButton.removeAttr('disabled');
      submissionInProgress = false;
      console.log(error);
    });
  });

  function getShareMessage() {
    return getSelectedReason().shareMessage;
  }

  // Handle Facebook Share clicks.
  $(document).on('click', '.share-fb', e => {
    e.preventDefault();

    const shareMessage = getShareMessage();
    const shareUrl = $(e.currentTarget).data('url') || window.location;

    const shareOptions = {
      method: 'share',
      href: shareUrl,
      quote: shareMessage
    };

    window.FB.ui(shareOptions, function() {
      const $overlayParent = $(e.currentTarget).parents('.overlay');
      if ($overlayParent.length) {
        $overlayParent.addClass('hidden');
      }
    });
  });

  // Handle Twitter share clicks.
  $('button.btn.btn-share.share-twitter').click(function(event) {
    var tweetParams = {};
    // We are removing hashtags for now until we can find an interesting one
    // tweetParams.hashtags = 'swearjar';
    tweetParams.text = getShareMessage();
    var siteUrl = $(event.currentTarget).data('url') || window.location;
    tweetParams.url = siteUrl;
    var tweetUrl = 'https://twitter.com/intent/tweet?original_referer=' +
        siteUrl + '&' + $.param(tweetParams);

    var windowName = 'Share on Twitter';
    var windowSize = 'width=550,height=420';
    window.open(tweetUrl, windowName, windowSize);
    event.preventDefault();
  });

  $('.overlay').on('click', '.close-overlay', e => {
    $(e.delegateTarget).addClass('hidden');
  });
})(window, jQuery);
