"use strict";

var column_ratios = ["10%", "26%", "10%", "10", "12%", "12%", "10%", "10%"];
function initFakeHeaders() {
  document.addEventListener('DOMContentLoaded', function () {
    var tableContainer = document.querySelector('.table-container');
    var fakeHeaders = document.querySelector('.fake-headers');
    window.addEventListener('scroll', function () {
      var scrollTop = document.documentElement.scrollTop || document.body.scrollTop.scrollTop;
      if (scrollTop > 0) {
        fakeHeaders.style.display = 'flex';
      } else {
        fakeHeaders.style.display = 'none';
      }
      var scrollLeft = this.document.documentElement.scrollLeft || this.document.body.scrollLeft.scrollLeft;
      if (scrollLeft > 0) fakeHeaders.style.left = "" + -scrollLeft + "px";else fakeHeaders.style.left = "0px";
    });

    // Синхронизация ширины фиктивных заголовков с заголовками таблицы
    function syncFakeHeaders() {
      var fakeHeaders = document.querySelectorAll('.fake-header');
      var fakeHeadersContainer = document.querySelector('.fake-headers');
      for (var i = 0; i < 8; i++) {
        fakeHeaders[i].style.width = column_ratios[i];
      }
      var scrollLeft = this.document.documentElement.scrollLeft || document.body.scrollLeft.scrollLeft;
      if (scrollLeft > 0) fakeHeadersContainer.style.left = "" + -scrollLeft + "px";else fakeHeadersContainer.style.left = "0px";
      // const tableHeadersArray = [].slice.call(tableHeaders);
      // tableHeadersArray.forEach((th, index) => {
      //     if (th.style.width){
      //     fakeHeaders[index].style.width = th.style.width;
      //     }
      // })
    }

    // syncFakeHeaders();
    window.addEventListener('resize', syncFakeHeaders);
  });
}