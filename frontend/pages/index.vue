<template>
<main
  :class="{ warning: pwned == true, success: pwned == false }"
>
  <h1 class="title">Is je telefoonnummer gelekt door Facebook?</h1>

  <div class="form">
    <div class="row">
      <input type="text"
        v-model="phoneNumber"
        placeholder="06 . . . . . . . ."
        @keyup.enter="checkPhoneNumber()"
        tabindex="1"
      />

      <button @click="checkPhoneNumber()">check</button>
    </div>

    <div class="row">
      <input type="text"
        v-model="name"
        placeholder="optioneel: je naam"
        @keyup.enter="checkPhoneNumber()"
        tabindex="2"
      />
    </div>
  </div>

  <h1 class="big-message">{{ bigMessage }}</h1>

  <h2 class="message" v-if="pwned != null">{{ message }}</h2>
  <div v-else class="spacer"></div>
</main>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'nuxt-property-decorator';

@Component
export default class Index extends Vue {
  phoneNumber = '';
  name = '';

  get bigMessage(): string
  {
    if (this.pwned == null) return '???';
    return this.pwned && this.nameMatches == null || this.nameMatches ? 'Jep, helaas.' : 'Nee.';
  }
  get message(): string | null
  {
    if (this.pwned == null) return null;

    if (!this.pwned)
      return 'Dit telefoonnummer zit niet bij de gelekte data.';

    if (this.nameMatches == null)
      return 'Dit telefoonnummer zit bij de gelekte data.';

    return this.nameMatches
      ? 'Deze gegevens zitten bij de gelekte data.'
      : 'Dit telefoonnummer zit bij de gelekte data, maar niet onder deze (exacte) naam.';
  }

  pwned: boolean | null = null;
  nameMatches: boolean | null = null;

  get sanitizedPhoneNumber()
  {
    let pn = this.phoneNumber.replace(/\s/g, '');
    if (!/^((\+|00)?31|0)\d{9}$/.test(pn)) return null;

    if (pn.substr(0, 4) == '+316') {
      return pn.slice(1);
    }
    else if (pn.substr(0,2) == '06') {
      return '31' + pn.slice(1);
    }
    return pn;
  }

  async checkPhoneNumber() {
    if (this.phoneNumber == '') {
      this.pwned = null;
      return;
    }
    if (!this.sanitizedPhoneNumber) {
      this.pwned = null;

      await this.$nextTick()
      alert('geen geldig telefoonnummer');
      return;
    }

    this.$axios.get<{ numberIsPwned: boolean, nameMatches: boolean | null }>(
      '/check',
      {
        params: {
          phoneNumber: this.sanitizedPhoneNumber,
          name: this.name || null,
        }
      }
    )
    .then(res => {
      this.pwned = res.data.numberIsPwned;
      this.nameMatches = res.data.nameMatches;
    })
    .catch(error => {
      if (!error.response) {
        alert('Kon de server niet bereiken. Probeer het over een minuutje nog eens.');
        console.error({...error});
        return;
      }
      if (error.response.status == 429) {
        alert('Server zegt: yo doe ff rustig');
        return;
      }
      if (error.response.status == 400) {
        alert('Server zegt: ' + error.response.data);
        return;
      }
      if (error.response.status == 500) {
        alert('Server zegt: ik snap het even niet meer :(');
        return;
      }
    });
  }
}
</script>

<style>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}
main > * {
  max-width: 100%;
}

main.success {
  background-color: #5B5;
}
main.warning {
  background-color: #F55;
}

.form {
  margin: 1.5em 0;
}

.form .row {
  display: flex;
  justify-content: stretch;
  width: 30em;
  max-width: 100%;
  min-width: 16em;
}
.form .row > * {
  vertical-align: middle;
}
.row:not(:last-child) {
  margin-bottom: 2.5rem;
}

button,
input[type="text"] {
  font-size: 1.5rem;
  border: none;
  outline: none;
  height: 2em;
}
button {
  padding: 0.5em;
  cursor: pointer;
  border-bottom: 3px solid #555;
  flex: none;
}
input[type="text"] {
  padding: 0.1em 0.5em 0;
  border-bottom: 3px dashed #555;
  flex: auto;
  min-width: 0;
}

.title,
.big-message,
.message {
  font-family:
    'Segoe UI',
    sans-serif;
  display: block;
  color: #232323;
  letter-spacing: 1px;
}
.title {
  font-size: 36px;
  font-weight: 400;
}

.big-message {
  font-weight: 300;
  font-size: 64px;
  margin-bottom: 1rem;
}
.message {
  font-weight: 400;
  font-size: 32px;
  word-spacing: 5px;
  padding-bottom: 15px;
}
</style>
