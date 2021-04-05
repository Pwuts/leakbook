import { formatNumber } from '../util.ts';
const encoder = new TextEncoder();

const dataSets: DataSet[] = [];
export default dataSets;

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
      entry.firstName == name ||
      entry.lastName == name ||
      `${entry.firstName} ${entry.lastName}` == name
    )
  })
}

for (const datasetDefFile of Deno.readDirSync('./datasets/defs')) {
  const datasetDef: DataSetDef = JSON.parse(
    Deno.readTextFileSync(`./datasets/defs/${datasetDefFile.name}`)
  );

  console.debug(`loading dataset "${datasetDef.name}" with ${datasetDef.files.length} files`);
  
  const entries: { [phoneNumber: string]: DataSetEntry } = {};
  let totalCount = 0;
  
  datasetDef.files.forEach((filename, index) => {
    let count = 0;

    const fileStats = Deno.statSync(`./datasets/files/${filename}`);
    if (!fileStats.isFile) {
      console.error(`file "${filename}" is not a file`);
      return;
    }
    Deno.stdout.writeSync(
      encoder.encode(`loading file #${index + 1} "${filename}" (${formatNumber(fileStats.size)}B)`)
    );

    console.time(' in');
    const fileContent = Deno.readTextFileSync(`./datasets/files/${filename}`);
    console.timeEnd(' in');

    console.time(' in');
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

      if (++count % 10000 == 0) {
        Deno.stdout.writeSync(
          encoder.encode(`\r${formatNumber(count)} entries processed`)
        );
      }
    }
    console.timeEnd(' in');
    totalCount += count;
  });

  console.debug(`loading dataset "${datasetDef.name}" finished:`, totalCount, 'entries loaded');

  dataSets.push({
    name: datasetDef.name,
    description: datasetDef.description,
    date: new Date(datasetDef.date),
    entries,
  });
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
