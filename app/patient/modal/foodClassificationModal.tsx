import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface FoodClassificationModalProps {
  visible: boolean;
  foodName: string;
  onClose: () => void;
  onClassify: (classification: 'good' | 'bad', quantity: number) => void;
}

const FoodClassificationModal: React.FC<FoodClassificationModalProps> = ({
  visible,
  foodName,
  onClose,
  onClassify,
}) => {
  const [selectedClassification, setSelectedClassification] = useState<'good' | 'bad' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleClassification = (classification: 'good' | 'bad') => {
    setSelectedClassification(classification);
    setShowResult(true);
    
    // Call the parent callback with quantity
    onClassify(classification, quantity);
    
    // Auto close after showing result for 1.5 seconds
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setSelectedClassification(null);
    setShowResult(false);
    setQuantity(1); // Reset quantity
    onClose();
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <View style={styles.modalContainer}>
          {!showResult ? (
            // Classification Selection View
            <>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color="black" />
                </TouchableOpacity>
              <View style={styles.modalHeader}>
                <Text style={styles.foodNameText}>{foodName}</Text>
              </View>
              
              <Text style={styles.questionText}>How would you classify this food:</Text>
              
              {/* Quantity Selector */}
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>Quantity:</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity 
                    style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]} 
                    onPress={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Text style={[styles.quantityButtonText, quantity <= 1 && styles.quantityButtonTextDisabled]}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton} 
                    onPress={() => handleQuantityChange(1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.classificationButton, styles.goodButton]}
                  onPress={() => handleClassification('good')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.goodButtonText}>Good Food</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.classificationButton, styles.badButton]}
                  onPress={() => handleClassification('bad')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.badButtonText}>Bad Food</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Result View
            <View style={styles.resultContainer}>
              <View style={[
                styles.resultIcon,
                selectedClassification === 'good' ? styles.goodResultIcon : styles.badResultIcon
              ]}>
                <Text style={styles.resultEmoji}>
                  {selectedClassification === 'good' ? '😊' : '☹️'}
                </Text>
              </View>
              
              <Text style={[
                styles.resultText,
                selectedClassification === 'good' ? styles.goodResultText : styles.badResultText
              ]}>
                {selectedClassification === 'good' ? 'Good Food' : 'Bad Food'}
              </Text>
              
              <Text style={styles.resultSubtext}>
                {foodName} has been classified as {selectedClassification} food
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: screenWidth * 0.85,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'center',
    marginBottom: 16,
  },
  foodNameText: {
    fontSize: 20,
    fontFamily:'DMSans700',
    textAlign: 'center',
    color: 'rgba(247, 108, 207, 1)',
    flex: 1,
  },
  closeButton: {
    width: 20,
    height: 20,
    position: 'absolute',
    right: 20,
    top: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999999',
    fontWeight: '300',
  },
  questionText: {
    fontSize: 16,
    color: 'rgba(55, 55, 55, 1)',
    textAlign: 'center',
    fontFamily:'Inter600',
    marginBottom: 16,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    color: 'rgba(55, 55, 55, 1)',
    fontFamily: 'Inter600',
    marginRight: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 1)',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: 'rgba(200, 200, 200, 1)',
  },
  quantityButtonText: {
    fontSize: 16,
    fontFamily: 'Inter600',
  },
  quantityButtonTextDisabled: {
    color: 'rgba(150, 150, 150, 1)',
  },
  quantityText: {
    fontSize: 16,
    color: 'rgba(55, 55, 55, 1)',
    fontFamily: 'Inter600',
    marginHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  classificationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodButton: {
    backgroundColor: 'rgba(112, 217, 92, 1)',
    borderWidth:0.6,
    borderColor:'rgba(64, 206, 35, 1)',
  },
  badButton: {
    borderWidth:0.6,
    borderColor:'rgba(252, 49, 48, 1)',
    backgroundColor: 'rgba(249, 98, 97, 1)',
  },
  goodButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily:'DMSans600',
  },
  badButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily:'DMSans600',
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  goodResultIcon: {
    backgroundColor: '#E8F5E8',
  },
  badResultIcon: {
    backgroundColor: '#FFE8E8',
  },
  resultEmoji: {
    fontSize: 24,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  goodResultText: {
    color: '#38C472',
  },
  badResultText: {
    color: '#FF6B6B',
  },
  resultSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FoodClassificationModal;