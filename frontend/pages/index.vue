<template>
  <div class="container"
    :class="{ warning: pwned == true, success: pwned == false }"
  >
    <h1 class="title small-title">Is je telefoonnummer gelekt door Facebook?</h1>

    <div>
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

    <h1 class="title">{{ title }}</h1>

    <h2 class="subtitle" v-if="pwned != null">{{ subtitle }}</h2>
    <div v-else class="spacer"></div>

    <span>Alle code van deze checker staat op <a href="https://github.com/Pwuts/leakbook">GitHub</a></span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'nuxt-property-decorator';

@Component
export default class Index extends Vue {
  phoneNumber = '';
  name = '';

  get title(): string
  {
    if (this.pwned == null) return '???';
    return this.pwned && this.nameMatches == null || this.nameMatches ? 'Jep.' : 'Nee.';
  }
  get subtitle(): string | null
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
    let pn = this.phoneNumber.replace(/\s/, '');
    if (!/^((\+|00)?31|0)?\d{9}$/.test(pn)) return null;

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
.container {
  margin: 0 auto;
  padding: 0.5em;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  text-align: center;
}

.container.success {
  background-color: #5B5;
}
.container.warning {
  background-color: #F55;
}

.container .row {
  display: flex;
  justify-content: stretch;
  width: 30em;
  max-width: 100%;
  white-space: nowrap;
}
.container .row > * {
  vertical-align: middle;
}
.row:not(:last-child) {
  margin-bottom: 2.5em;
}

button,
input[type="text"] {
  font-size: 2rem;
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
}

.title {
  font-family:
    'Quicksand',
    'Source Sans Pro',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  display: block;
  font-weight: 300;
  font-size: 72px;
  color: #424242;
  letter-spacing: 1px;
}
.small-title {
  font-size: 42px;
  font-weight: 400;
}

.subtitle {
  font-weight: 300;
  font-size: 40px;
  color: #494949;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
