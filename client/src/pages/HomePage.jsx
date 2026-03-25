import {
  CategoryBar,
  FeaturedProducts,
  HeroSection,
  NewsletterSection,
  PromoBanner,
  PromoSection,
  WhyChooseUs,
} from '../components/home';

const HomePage = () => {
  return (
    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
      <HeroSection />
      <CategoryBar />
      <FeaturedProducts />
      <PromoBanner />
      <WhyChooseUs />
      <PromoSection />
      <NewsletterSection />
    </div>
  );
};

export default HomePage;
