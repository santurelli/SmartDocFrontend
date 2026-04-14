import React from 'react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import AsyncCreatableSelect from 'react-select/async-creatable';
import WrenchModalButton from './WrenchModalButton';

/**
 * EntitySelectGroup
 * A reusable component that combines a Label, a Select (Sync or Async), 
 * and a Wrench icon that opens a management modal.
 */
const EntitySelectGroup = ({
    label,
    loadOptions, // For Async
    options,     // For Sync
    isAsync = true,
    value,
    onChange,
    ModalComponent,
    modalProps = {},
    placeholder = "Seleziona...",
    isCreatable = false,
    onCreateOption,
    title = "Gestione",
    onModalClose,
    noOptionsMessage,
    loadingMessage,
    isClearable = true,
    widthClass = '',
    isDisabled = false
}) => {

    let SelectComponent;
    if (isAsync) {
        SelectComponent = isCreatable ? AsyncCreatableSelect : AsyncSelect;
    } else {
        SelectComponent = Select;
    }

    const commonStyles = {
        control: (base) => ({
            ...base,
            borderTopLeftRadius: '4px',
            borderBottomLeftRadius: '4px',
            borderTopRightRadius: '0px',
            borderBottomRightRadius: '0px',
            borderColor: '#dfe4e7',
            minHeight: '38px',
            height: '38px',
            boxShadow: 'none',
            '&:hover': { borderColor: '#ccc' }
        }),
        valueContainer: (base) => ({
            ...base,
            height: '38px',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center'
        }),
        input: (base) => ({
            ...base,
            margin: '0px',
            padding: '0px'
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: '36px'
        }),
        placeholder: (base) => ({
            ...base,
            color: '#999'
        }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    };

    const selectProps = isAsync
        ? { loadOptions, cacheOptions: true, defaultOptions: true }
        : { options };

    return (
        <div className="form-group">
            {label && <label>{label}</label>}
            <div className={`flex-input-group ${widthClass}`}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <SelectComponent
                        {...selectProps}
                        inputId="entity-select-input"
                        autoComplete="off" // Prevent browser address modals
                        onChange={onChange}
                        onCreateOption={onCreateOption}
                        value={value}
                        placeholder={placeholder}
                        styles={commonStyles}
                        isClearable={isClearable}
                        isDisabled={isDisabled}
                        formatCreateLabel={isCreatable ? (inputValue) => `Crea "${inputValue}"` : undefined}
                        noOptionsMessage={noOptionsMessage || (({ inputValue }) =>
                            !inputValue
                                ? (isAsync ? "Inizia a scrivere per cercare..." : "Nessun risultato trovato")
                                : `Nessun risultato trovato per "${inputValue}"`
                        )}
                        loadingMessage={loadingMessage || (() => "Caricamento in corso...")}
                        menuPortalTarget={document.body}
                    />
                </div>
                {ModalComponent && (
                    <WrenchModalButton
                        ModalComponent={ModalComponent}
                        modalProps={modalProps}
                        title={title}
                        onClose={onModalClose}
                        disabled={isDisabled}
                    />
                )}
            </div>
        </div>


    );
};

export default EntitySelectGroup;
