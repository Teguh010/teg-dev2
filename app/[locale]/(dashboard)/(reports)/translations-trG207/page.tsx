"use client"
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import LayoutLoader from "@/components/layout-loader";
import LanguageSelector from "./components/Language-selector";
import ReferenceLanguageSelector from "./components/reference-language-selector";
import TranslationForm from "./components/translation-form";
import TranslationsTable from "./components/translation-table";
import { controller } from "./controller";
import toast from "react-hot-toast";
import flag1 from "@/public/images/all-img/flag-1.png";
import flag2 from "@/public/images/all-img/flag-4.png";
import flag3 from "@/public/images/all-img/flag_francia.webp";
import flag4 from "@/public/images/all-img/images_lt.png";
import flag5 from "@/public/images/all-img/indonesia_flag.png";
import flag6 from "@/public/images/all-img/Flag_Russia.png";
import flag7 from "@/public/images/all-img/flag_noruega.png";

const languageData = [
  {
    name: "En",
    slug: "en",
    flag: flag1
  },
  {
    name: "Es",
    slug: "es",
    flag: flag2
  },
  {
    name: "Fr",
    slug: "fr",
    flag: flag3
  },
  {
    name: "Lt",
    slug: "lt",
    flag: flag4
  },
  {
    name: "ID",
    slug: "id",
    flag: flag5
  },
  {
    name: "Ru",
    slug: "ru",
    flag: flag6
  },
  {
    name: "No",
    slug: "no",
    flag: flag7
  },
];

const TranslationsPage = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();
  const { 
    translations = [],
    currentLanguage, 
    isLoading,
    translationInputs,
    referenceLanguage,
  } = models;

  const [categoriesState, setCategories] = useState<string[]>([]);

  const availableReferenceLanguages = languageData.filter(lang => lang.slug !== currentLanguage);

  useEffect(() => {
    if (referenceLanguage === currentLanguage) {
      const newReferenceLanguage = availableReferenceLanguages[0]?.slug || 'en';
      operations.setReferenceLanguage(newReferenceLanguage);
    }
  }, [currentLanguage, referenceLanguage, availableReferenceLanguages, operations]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/translation/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories); 
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveTranslations = async (updatedTranslations) => {
    try {
      await operations.updateTranslation(updatedTranslations);
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error(t('translation_page.error_saving_translations'));
    }
  };

  if (isLoading) {
    return <LayoutLoader />;
  }



  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('translation_page.translation_management')}</h1>
        <LanguageSelector
          languages={languageData}
          selectedLanguage={currentLanguage}
          onSelect={operations.setCurrentLanguage}
        />
      </div>

      {/* <ReferenceLanguageSelector
        languages={availableReferenceLanguages}
        selectedLanguage={referenceLanguage}
        onSelect={operations.setReferenceLanguage}
        onCheckMissingKeys={operations.checkMissingKeys}
        t={t}
      /> */}

      <TranslationForm
        translationInputs={translationInputs}
        onAddInputField={operations.addInputField}
        onRemoveInputField={operations.removeInputField}
        onInputChange={operations.handleInputChange}
        onAddTranslations={operations.addTranslations}
        t={t}
        categories={categoriesState}
        handleFileUpload={operations.handleFileUpload}
        isUploading={models.isUploading}
        submitUploadedTranslations={operations.submitUploadedTranslations}
        hasUploadedTranslations={models.uploadedTranslations.length > 0}
      />

      <TranslationsTable
        translations={translations}
        categories={categoriesState}
        onSaveTranslations={handleSaveTranslations}
        onDeleteTranslation={operations.deleteTranslation}
        t={t}
      />

     
    </div>
  );
};

export default TranslationsPage;