(function(){
  document.querySelectorAll('.fill').forEach(function(f){
    requestAnimationFrame(function(){ f.style.width=(f.dataset.pct||0)+'%'; });
  });
  document.querySelectorAll('button.give').forEach(function(btn){
    btn.addEventListener('click', function(){
      btn.closest('.item').querySelector('.status').textContent =
        'Checkout isn’t connected in this preview. On the live page this opens a secure Stripe checkout for the ' + btn.dataset.item + ', where you choose the amount.';
    });
  });
})();
