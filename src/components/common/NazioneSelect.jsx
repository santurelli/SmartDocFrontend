import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import NazioniService from '../../services/NazioniService';

const NazioneSelect = ({ value, onChange, className }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNazioni = async () => {
      try {
        const response = await NazioniService.getAll();
        const data = response.data.map(n => ({
          value: n.nome,
          label: `${n.nome} (${n.codiceIso})`,
          codiceIso: n.codiceIso
        }));
        setOptions(data);
      } catch (error) {
        console.error('Errore nel caricamento delle nazioni', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNazioni();
  }, []);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '34px',
      height: '34px',
      borderRadius: '4px',
      borderColor: '#ccc',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#66afe9'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '34px',
      padding: '0 6px'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px'
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '34px'
    })
  };

  const selectedOption = options.find(opt => opt.value === value) || (value ? { value, label: value } : null);

  return (
    <Select
      className={className}
      options={options}
      value={selectedOption}
      onChange={(val) => onChange(val ? val.value : '')}
      placeholder="Seleziona Nazione..."
      isClearable
      isLoading={loading}
      styles={customStyles}
      noOptionsMessage={() => "Nessuna nazione trovata"}
    />
  );
};

export default NazioneSelect;
