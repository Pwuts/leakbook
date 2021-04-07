import { formatNumber } from '../util.ts';
const encoder = new TextEncoder();

const dataSets: DataSet[] = [];

export function numberIsLeaked(phoneNumber: string)
{
  return dataSets.some(ds => phoneNumber in ds.entries)
}

export function nameMatchesPhoneNumber(phoneNumber: string, name: string)
{
  return dataSets.some(ds => {
    if (!numberIsLeaked(phoneNumber)) throw new Error('no entry for phone number');

    const entry = ds.entries[phoneNumber];
    return (
      entry.firstName?.toLowerCase() == name.toLowerCase() ||
      entry.lastName?.toLowerCase() == name.toLowerCase() ||
      (
        entry.firstName &&
        entry.lastName &&
        `${entry.firstName} ${entry.lastName}`.toLowerCase() == name.toLowerCase()
      )
    )
  })
}

let loaded = false;
export const loading = new Promise<void>(async resolve => {
  for await (const datasetDefFile of Deno.readDir('./datasets/defs')) {
    const datasetDef: DataSetDef = JSON.parse(
      await Deno.readTextFile(`./datasets/defs/${datasetDefFile.name}`)
    );

    console.debug(`loading dataset "${datasetDef.name}" with ${datasetDef.files.length} files`);
    console.time(' in');

    const entries: { [phoneNumber: string]: DataSetEntry } = {};
    let totalCount = 0;

    await Promise.all(datasetDef.files.map(async (filename, index) => {
      let count = 0;

      const fileStats = await Deno.stat(`./datasets/files/${filename}`);
      if (!fileStats.isFile) {
        console.error(`file "${filename}" is not a file`);
        return;
      }
      Deno.stdout.writeSync(
        encoder.encode(`loading file #${index + 1} "${filename}" (${formatNumber(fileStats.size)}B)\n`)
      );

      const fileContent = await Deno.readTextFile(`./datasets/files/${filename}`);

      for (let line of fileContent.split('\n')) {
        if (line.length < 11) continue;

        const [
          phoneNumber,
          id,
          firstName,
          lastName,
          gender,
          residence,
          origin,
          relationshipStatus,
          employer,
          registrationDate,
          email
        ] = line.split(':').map(e => e == '' ? null : e);

        if (!phoneNumber) continue;
        if (!/31\d{9}/.test(phoneNumber)) {
          console.warn(`weird phone number: "${phoneNumber}"`);
        }

        entries[phoneNumber] = {
          phoneNumber,
          // id,
          firstName,
          lastName,
          // gender,
          // residence,
          // origin,
          // relationshipStatus,
          // employer,
          // registrationDate,
          // email
        };

        if (++totalCount % 10000 == 0) {
          Deno.stdout.writeSync(
            encoder.encode(`\r${formatNumber(totalCount)} entries processed`)
          );
        }
      }

      totalCount += count;
      return count;
    }));

    Deno.stdout.writeSync(
      encoder.encode(`\nloading dataset "${datasetDef.name}" finished: ${totalCount} entries loaded`)
    );
    console.timeEnd(' in');

    dataSets.push({
      name: datasetDef.name,
      description: datasetDef.description,
      date: new Date(datasetDef.date),
      entries,
      length: totalCount,
    });
  }

  loaded = true;
  resolve();
});

export function doneLoading(): boolean
{
  return loaded;
}

/* Types */

type DataSetDef = {
  name: string;
  description: string;
  date: string; // ISO date
  files: string[];
}

type DataSet = {
  name: string;
  description: string;
  date: Date;
  entries: { [phoneNumber: string]: DataSetEntry };
  length: number;
}

type DataSetEntry = {
  phoneNumber:        string | null;
  // id:                 string | null;
  firstName:          string | null;
  lastName:           string | null;
  // gender:             string | null;
  // residence:          string | null;
  // origin:             string | null;
  // relationshipStatus: string | null;
  // employer:           string | null;
  // registrationDate:   string | null;
  // email:              string | null;
};
