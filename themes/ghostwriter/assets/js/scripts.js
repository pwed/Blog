jQuery(function ($) {
  /* ============================================================ */
  /* Responsive Videos */
  /* ============================================================ */

  $(".post-content").fitVids();

  /* ============================================================ */
  /* Scroll To Top */
  /* ============================================================ */

  $(".js-jump-top").on("click", function (e) {
    e.preventDefault();

    $("html, body").animate({ scrollTop: 0 });
  });
});

count = window.document.getElementById("count");
if (count != null) {
  fetch(`https://${API}/count?path=${window.document.URL}`)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      count.innerHTML = `Post Views: ${json.COUNT}`;
    });
}
