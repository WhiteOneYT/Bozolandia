document.getElementById('etap1').style.display = 'block';
document.getElementById('etap2').style.display = 'none';
document.getElementById('etap3').style.display = 'none';

function etap1() {
  document.getElementById('etap1').style.display = 'none';
  document.getElementById('etap2').style.display = 'block';
  document.getElementById('etap3').style.display = 'none';

  var imie = document.getElementById('imie').value;
  var nazwisko = document.getElementById('nazwisko').value;

  window.imie = imie;
  window.nazwisko = nazwisko;
}

function etap2() {
  document.getElementById('etap1').style.display = 'none';
  document.getElementById('etap2').style.display = 'none';
  document.getElementById('etap3').style.display = 'block';
}

function etap3() {
  var haslo1 = document.getElementById('haslo1').value;
  var haslo2 = document.getElementById('haslo2').value;

  if (haslo1 !== haslo2) {
    alert("Podane hasła nie są takie same");
  } else {
    console.log("Rejestracja zakończona dla: " + window.imie + ' ' + window.nazwisko);
  }
}
